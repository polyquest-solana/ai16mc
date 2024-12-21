import {
  Connection,
  PublicKey,
  SendOptions,
  Signer,
  TransactionInstruction,
  AddressLookupTableAccount,
  VersionedTransaction,
  TransactionMessage,
  ComputeBudgetProgram,
  Transaction,
  SerializeConfig,
  BlockhashWithExpiryBlockHeight,
  TransactionSignature,
  TransactionExpiredBlockheightExceededError,
} from "@solana/web3.js";
import bs58 from "bs58";

export async function sendTransaction(
  connection: Connection,
  payer: PublicKey,
  instructions: TransactionInstruction[],
  signers: Signer[]
) {
  const signature = await sendSmartTransaction(
    connection,
    instructions,
    signers,
    [],
    {
      feePayer: payer,
    }
  );

  console.log("TX(signature): ", signature);

  return signature;
}

export type SmartTransactionContext = {
  transaction: Transaction | VersionedTransaction;
  blockhash: BlockhashWithExpiryBlockHeight;
  minContextSlot: number;
};

async function createSmartTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  signers: Signer[],
  lookupTables: AddressLookupTableAccount[] = [],
  feePayer: PublicKey,
  serializeOptions: SerializeConfig = {
    requireAllSignatures: true,
    verifySignatures: true,
  }
): Promise<SmartTransactionContext> {
  if (!signers.length) {
    throw new Error("The transaction must have at least one signer");
  }

  // Check if any of the instructions provided set the compute unit price and/or limit, and throw an error if true
  const existingComputeBudgetInstructions = instructions.filter((instruction) =>
    instruction.programId.equals(ComputeBudgetProgram.programId)
  );

  if (existingComputeBudgetInstructions.length > 0) {
    throw new Error(
      "Cannot provide instructions that set the compute unit price and/or limit"
    );
  }

  // For building the transaction
  // const payerKey = feePayer ? feePayer.publicKey : signers[0].publicKey;
  //   const payerKey = feePayer ? feePayer : wallet.publicKey;
  const {
    context: { slot: minContextSlot },
    value: blockhash,
  } = await connection.getLatestBlockhashAndContext();
  const recentBlockhash = blockhash.blockhash;

  // Determine if we need to use a versioned transaction
  const isVersioned = lookupTables.length > 0;
  let legacyTransaction: Transaction | null = null;
  let versionedTransaction: VersionedTransaction | null = null;

  // Build the initial transaction based on whether lookup tables are present
  if (isVersioned) {
    const v0Message = new TransactionMessage({
      instructions,
      payerKey: feePayer,
      recentBlockhash,
    }).compileToV0Message(lookupTables);

    versionedTransaction = new VersionedTransaction(v0Message);

    // Include feePayer in signers if it exists and is not already in the list
    // const allSigners = feePayer ? [...signers, feePayer] : signers;
    versionedTransaction.sign(signers);
  } else {
    legacyTransaction = new Transaction().add(...instructions);
    legacyTransaction.recentBlockhash = recentBlockhash;
    legacyTransaction.feePayer = feePayer;

    for (const signer of signers) {
      legacyTransaction.partialSign(signer);
    }
  }

  // Serialize the transaction
  const serializedTransaction = bs58.encode(
    isVersioned
      ? versionedTransaction!.serialize()
      : legacyTransaction!.serialize(serializeOptions)
  );

  // Get the priority fee estimate based on the serialized transaction
  // const priorityFeeEstimateResponse = await getPriorityFeeEstimate({
  //   connection,
  //   transaction: serializedTransaction,
  //   options: {
  //     recommended: true,
  //   },
  // });

  // const { priorityFeeEstimate } = priorityFeeEstimateResponse;

  // if (!priorityFeeEstimate) {
  //   throw new Error("Priority fee estimate not available");
  // }

  // Add the compute unit price instruction with the estimated fee
  const computeBudgetIx = ComputeBudgetProgram.setComputeUnitPrice({
    microLamports: 30000, //Math.ceil(priorityFeeEstimate),
  });

  instructions.unshift(computeBudgetIx);

  // Get the optimal compute units
  const units = await getComputeUnits(
    connection,
    instructions,
    feePayer,
    isVersioned ? lookupTables : [],
    signers
  );

  if (!units) {
    throw new Error(
      `Error fetching compute units for the instructions provided`
    );
  }

  // For very small transactions, such as simple transfers, default to 1k CUs
  const customersCU = units < 1000 ? 1000 : Math.ceil(units * 1.1);

  const computeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
    units: customersCU,
  });

  instructions.unshift(computeUnitsIx);

  // Rebuild the transaction with the final instructions
  if (isVersioned) {
    const v0Message = new TransactionMessage({
      instructions,
      payerKey: feePayer,
      recentBlockhash,
    }).compileToV0Message(lookupTables);

    versionedTransaction = new VersionedTransaction(v0Message);

    // const allSigners = feePayer ? [...signers, feePayer] : signers;
    versionedTransaction.sign(signers);

    return {
      transaction: versionedTransaction,
      blockhash,
      minContextSlot,
    };
  }
  legacyTransaction = new Transaction().add(...instructions);
  legacyTransaction.recentBlockhash = recentBlockhash;
  legacyTransaction.feePayer = feePayer;

  for (const signer of signers) {
    legacyTransaction.partialSign(signer);
  }

  return {
    transaction: legacyTransaction,
    blockhash,
    minContextSlot,
  };
}

async function getComputeUnits(
  connection: Connection,
  instructions: TransactionInstruction[],
  payer: PublicKey,
  lookupTables: AddressLookupTableAccount[],
  signers?: Signer[]
): Promise<number | null> {
  const testInstructions = [
    ComputeBudgetProgram.setComputeUnitLimit({ units: 1_400_000 }),
    ...instructions,
  ];

  const testTransaction = new VersionedTransaction(
    new TransactionMessage({
      instructions: testInstructions,
      payerKey: payer,
      recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    }).compileToV0Message(lookupTables)
  );

  if (signers) {
    testTransaction.sign(signers);
  }

  const rpcResponse = await connection.simulateTransaction(testTransaction, {
    replaceRecentBlockhash: true,
    sigVerify: false,
  });

  if (rpcResponse.value.err) {
    console.error(
      `Simulation error: ${JSON.stringify(rpcResponse.value.err, null, 2)}`
    );
    return null;
  }

  return rpcResponse.value.unitsConsumed || null;
}

export enum PriorityLevel {
  MIN = "Min",
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  VERY_HIGH = "VeryHigh",
  UNSAFE_MAX = "UnsafeMax",
  DEFAULT = "Default",
}

export enum UiTransactionEncoding {
  Binary = "binary",
  Base64 = "base64",
  Base58 = "base58",
  Json = "json",
  JsonParsed = "jsonParsed",
}

export interface GetPriorityFeeEstimateOptions {
  priorityLevel?: PriorityLevel;
  includeAllPriorityFeeLevels?: boolean;
  transactionEncoding?: UiTransactionEncoding;
  lookbackSlots?: number;
  recommended?: boolean;
}

export interface GetPriorityFeeEstimateRequest {
  connection: Connection;
  transaction?: string;
  accountKeys?: string[];
  options?: GetPriorityFeeEstimateOptions;
}

export interface MicroLamportPriorityFeeLevels {
  min: number;
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
  unsafeMax: number;
}

export interface GetPriorityFeeEstimateResponse {
  priorityFeeEstimate?: number;
  priorityFeeLevels?: MicroLamportPriorityFeeLevels;
}

async function getPriorityFeeEstimate(
  params: GetPriorityFeeEstimateRequest
): Promise<GetPriorityFeeEstimateResponse> {
  try {
    const { connection, ...rest } = params;
    const url = `${params.connection.rpcEndpoint}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getPriorityFeeEstimate",
        params: [rest],
      }),
    });

    const data = await response.json();

    // @ts-ignore
    return data.result as GetPriorityFeeEstimateResponse;
  } catch (error) {
    throw new Error(`Error fetching priority fee estimate: ${error}`);
  }
}

async function sendSmartTransaction(
  connection: Connection,
  instructions: TransactionInstruction[],
  signers: Signer[],
  lookupTables: AddressLookupTableAccount[] = [],
  sendOptions: SendOptions & {
    feePayer?: PublicKey;
    lastValidBlockHeightOffset?: number;
  } = {
    skipPreflight: false,
    lastValidBlockHeightOffset: 150,
  }
): Promise<TransactionSignature> {
  const lastValidBlockHeightOffset =
    sendOptions.lastValidBlockHeightOffset ?? 150;

  if (lastValidBlockHeightOffset < 0)
    throw new Error("expiryBlockOffset must be a positive integer");

  try {
    // Create a smart transaction
    const { transaction, blockhash, minContextSlot } =
      await createSmartTransaction(
        connection,
        instructions,
        signers,
        lookupTables,
        sendOptions.feePayer!,
        {
          verifySignatures: true,
          requireAllSignatures: true,
        }
      );

    const commitment = sendOptions?.preflightCommitment || "confirmed";

    const currentBlockHeight = await connection.getBlockHeight();
    const lastValidBlockHeight = Math.min(
      blockhash.lastValidBlockHeight,
      currentBlockHeight + lastValidBlockHeightOffset
    );

    let error: Error;

    // We will retry the transaction on TransactionExpiredBlockheightExceededError
    // until the lastValidBlockHeightOffset is reached in case the transaction is
    // included after the lastValidBlockHeight due to network latency or
    // to the leader not forwarding the transaction for an unknown reason
    // Worst case scenario, it'll retry until the lastValidBlockHeightOffset is reached
    // The tradeoff is better reliability at the cost of a possible longer confirmation time
    do {
      try {
        // signature does not change when it resends the same one
        const signature = await connection.sendRawTransaction(
          transaction.serialize(),
          {
            maxRetries: 0,
            preflightCommitment: "confirmed",
            skipPreflight: sendOptions.skipPreflight,
            minContextSlot,
            ...sendOptions,
          }
        );

        const abortSignal = AbortSignal.timeout(15000);
        await connection.confirmTransaction(
          {
            abortSignal,
            signature,
            blockhash: blockhash.blockhash,
            lastValidBlockHeight: lastValidBlockHeight,
          },
          commitment
        );

        abortSignal.removeEventListener("abort", () => {});

        return signature;
      } catch (_error: any) {
        if (!(_error instanceof Error)) error = new Error();

        error = _error;
      }
    } while (!(error instanceof TransactionExpiredBlockheightExceededError));
  } catch (error) {
    throw new Error(`Error sending smart transaction: ${error}`);
  }

  throw new Error("Transaction failed to confirm within lastValidBlockHeight");
}
