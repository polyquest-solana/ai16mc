use anchor_lang::prelude::*;

#[error_code]
pub enum ProgramErrorCode {
    #[msg("The configuration account is already initialized.")]
    AlreadyInitialized,
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,
    #[msg("Operation resulted in an error.")]
    MathOperationError,
    #[msg("Market/AdjournMarket: Market is not finished")]
    MarketNotFinished,
    #[msg("Market/DraftMarket: Market key does exist")]
    MarketDoesExist,
    #[msg("Market/Bet: Market is not approved")]
    MarketNotApproved,
    #[msg("The maximum number of answers has been reached.")]
    MaxAnswersReached,
    #[msg("The answer key already exists.")]
    AnswerAlreadyExists,
    #[msg("The answer key does not exist.")]
    AnswerNotExists,
    #[msg("Market/SuccessMarket: Market does not contain answerKey")]
    MarketDoesNotContainAnswerKey,
    #[msg("Market/Receive: Cannot receive token")]
    CannotClaimToken,
    #[msg("Market/Retrieve: Cannot Retrieve not finished market")]
    CannotRetrieveToken,
    #[msg("Market/Retrieve: Cannot Retrieve before 180 days")]
    CannotRetrieveBeforeDate,
    #[msg("Market/Receive: Answer key is not succeeded answer key")]
    AnswerKeyNotRight,
    #[msg("Market/Bet: Invalid bet mint")]
    InvalidBetMint,
    #[msg("Market/ClaimToken: Invalid time range")]
    InvalidTimeRange,
    #[msg("Operation Error: Overflow")]
    Overflow,
}
