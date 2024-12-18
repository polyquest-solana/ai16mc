/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/forecast_market.json`.
 */
export type ForecastMarket = {
  "address": "DQ31XNvikuu2gaQaxwSo2BpAkWiTWwTc6iEJcvjNLLBy",
  "metadata": {
    "name": "forecastMarket",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addAnswerKeys",
      "discriminator": [
        89,
        115,
        155,
        223,
        0,
        19,
        17,
        59
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "configAccount",
          "writable": true
        },
        {
          "name": "marketAccount",
          "writable": true
        },
        {
          "name": "answerAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  110,
                  115,
                  119,
                  101,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "market_account.market_key",
                "account": "marketAccount"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "anwserKeys",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "adjournMarket",
      "discriminator": [
        122,
        223,
        248,
        29,
        26,
        4,
        248,
        39
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "configAccount",
          "writable": true
        },
        {
          "name": "marketAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "approveMarket",
      "discriminator": [
        195,
        83,
        73,
        224,
        150,
        237,
        150,
        5
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "configAccount",
          "writable": true
        },
        {
          "name": "marketAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "bet",
      "discriminator": [
        94,
        203,
        166,
        126,
        20,
        243,
        169,
        82
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "configAccount",
          "writable": true
        },
        {
          "name": "betMint",
          "writable": true
        },
        {
          "name": "userTokenAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "marketAccount"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "betMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "marketAccount",
          "writable": true
        },
        {
          "name": "answerAccount",
          "writable": true
        },
        {
          "name": "betAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  101,
                  116,
                  116,
                  105,
                  110,
                  103
                ]
              },
              {
                "kind": "account",
                "path": "voter"
              },
              {
                "kind": "account",
                "path": "market_account.market_key",
                "account": "marketAccount"
              },
              {
                "kind": "arg",
                "path": "answerKey"
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "anwserKey",
          "type": "u64"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimToken",
      "discriminator": [
        116,
        206,
        27,
        191,
        166,
        19,
        0,
        73
      ],
      "accounts": [
        {
          "name": "voter",
          "writable": true,
          "signer": true
        },
        {
          "name": "configAccount",
          "writable": true
        },
        {
          "name": "betMint",
          "writable": true
        },
        {
          "name": "rewardMint",
          "writable": true
        },
        {
          "name": "userBetTokenAccount",
          "writable": true
        },
        {
          "name": "vaultBetTokenAccount",
          "writable": true
        },
        {
          "name": "userRewardTokenAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "voter"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "rewardMint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "vaultRewardTokenAccount",
          "writable": true
        },
        {
          "name": "marketAccount",
          "writable": true
        },
        {
          "name": "betAccount",
          "writable": true
        },
        {
          "name": "answerAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "draftMarket",
      "discriminator": [
        251,
        196,
        130,
        72,
        251,
        64,
        188,
        39
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "betMint",
          "writable": true
        },
        {
          "name": "configAccount",
          "writable": true
        },
        {
          "name": "marketAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "marketKey"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "marketKey",
          "type": "u64"
        },
        {
          "name": "creator",
          "type": "pubkey"
        },
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "createFee",
          "type": "u64"
        },
        {
          "name": "creatorFeePercentage",
          "type": "u64"
        },
        {
          "name": "cojamFeePercentage",
          "type": "u64"
        }
      ]
    },
    {
      "name": "finishMarket",
      "discriminator": [
        200,
        216,
        58,
        2,
        224,
        204,
        151,
        26
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "configAccount",
          "writable": true
        },
        {
          "name": "marketAccount",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "configAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "rewardMint",
          "type": "pubkey"
        },
        {
          "name": "rewardApr",
          "type": "u64"
        }
      ]
    },
    {
      "name": "retrieveTokens",
      "discriminator": [
        208,
        194,
        68,
        55,
        183,
        22,
        93,
        135
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "configAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "remainsTokenAccount",
          "writable": true
        },
        {
          "name": "marketAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associateTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "setAccount",
      "discriminator": [
        100,
        58,
        16,
        200,
        83,
        84,
        162,
        203
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "configAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "serviceFeeAccount",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "remainAccount",
          "type": {
            "option": "pubkey"
          }
        }
      ]
    },
    {
      "name": "successMarket",
      "discriminator": [
        252,
        13,
        1,
        40,
        160,
        91,
        131,
        212
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "configAccount",
          "writable": true
        },
        {
          "name": "marketAccount",
          "writable": true
        },
        {
          "name": "vaultTokenAccount",
          "writable": true
        },
        {
          "name": "creatorTokenAccount",
          "writable": true
        },
        {
          "name": "serviceTokenAccount",
          "writable": true
        },
        {
          "name": "answerAccount",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associateTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "answerKey",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateOwner",
      "discriminator": [
        164,
        188,
        124,
        254,
        132,
        26,
        198,
        178
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "configAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "newOwner",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "updateRewardConfig",
      "discriminator": [
        35,
        111,
        215,
        56,
        135,
        228,
        232,
        50
      ],
      "accounts": [
        {
          "name": "owner",
          "writable": true,
          "signer": true
        },
        {
          "name": "configAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "rewardMint",
          "type": {
            "option": "pubkey"
          }
        },
        {
          "name": "rewardApr",
          "type": {
            "option": "u64"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "answerAccount",
      "discriminator": [
        75,
        175,
        139,
        96,
        119,
        135,
        123,
        71
      ]
    },
    {
      "name": "bettingAccount",
      "discriminator": [
        128,
        101,
        147,
        11,
        71,
        96,
        22,
        160
      ]
    },
    {
      "name": "configAccount",
      "discriminator": [
        189,
        255,
        97,
        70,
        186,
        189,
        24,
        102
      ]
    },
    {
      "name": "marketAccount",
      "discriminator": [
        201,
        78,
        187,
        225,
        240,
        198,
        201,
        251
      ]
    }
  ],
  "events": [
    {
      "name": "answerAdded",
      "discriminator": [
        82,
        95,
        97,
        36,
        223,
        127,
        175,
        26
      ]
    },
    {
      "name": "betPlaced",
      "discriminator": [
        88,
        88,
        145,
        226,
        126,
        206,
        32,
        0
      ]
    },
    {
      "name": "marketAdjourned",
      "discriminator": [
        255,
        9,
        83,
        139,
        244,
        130,
        217,
        61
      ]
    },
    {
      "name": "marketApproved",
      "discriminator": [
        213,
        222,
        68,
        97,
        16,
        1,
        31,
        38
      ]
    },
    {
      "name": "marketDrafted",
      "discriminator": [
        165,
        166,
        240,
        170,
        76,
        56,
        133,
        177
      ]
    },
    {
      "name": "marketFinished",
      "discriminator": [
        55,
        252,
        141,
        64,
        190,
        178,
        104,
        34
      ]
    },
    {
      "name": "marketSuccess",
      "discriminator": [
        28,
        146,
        105,
        87,
        226,
        249,
        99,
        105
      ]
    },
    {
      "name": "rewardClaimed",
      "discriminator": [
        49,
        28,
        87,
        84,
        158,
        48,
        229,
        175
      ]
    },
    {
      "name": "tokenClaimed",
      "discriminator": [
        49,
        144,
        233,
        63,
        84,
        154,
        232,
        26
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "alreadyInitialized",
      "msg": "The configuration account is already initialized."
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "You are not authorized to perform this action."
    },
    {
      "code": 6002,
      "name": "mathOperationError",
      "msg": "Operation resulted in an error."
    },
    {
      "code": 6003,
      "name": "marketNotFinished",
      "msg": "Market/AdjournMarket: Market is not finished"
    },
    {
      "code": 6004,
      "name": "marketDoesExist",
      "msg": "Market/DraftMarket: Market key does exist"
    },
    {
      "code": 6005,
      "name": "marketNotApproved",
      "msg": "Market/Bet: Market is not approved"
    },
    {
      "code": 6006,
      "name": "maxAnswersReached",
      "msg": "The maximum number of answers has been reached."
    },
    {
      "code": 6007,
      "name": "answerAlreadyExists",
      "msg": "The answer key already exists."
    },
    {
      "code": 6008,
      "name": "answerNotExists",
      "msg": "The answer key does not exist."
    },
    {
      "code": 6009,
      "name": "marketDoesNotContainAnswerKey",
      "msg": "Market/SuccessMarket: Market does not contain answerKey"
    },
    {
      "code": 6010,
      "name": "cannotClaimToken",
      "msg": "Market/Receive: Cannot receive token"
    },
    {
      "code": 6011,
      "name": "cannotRetrieveToken",
      "msg": "Market/Retrieve: Cannot Retrieve not finished market"
    },
    {
      "code": 6012,
      "name": "cannotRetrieveBeforeDate",
      "msg": "Market/Retrieve: Cannot Retrieve before 180 days"
    },
    {
      "code": 6013,
      "name": "answerKeyNotRight",
      "msg": "Market/Receive: Answer key is not succeeded answer key"
    },
    {
      "code": 6014,
      "name": "invalidBetMint",
      "msg": "Market/Bet: Invalid bet mint"
    },
    {
      "code": 6015,
      "name": "invalidTimeRange",
      "msg": "Market/ClaimToken: Invalid time range"
    },
    {
      "code": 6016,
      "name": "overflow",
      "msg": "Operation Error: Overflow"
    }
  ],
  "types": [
    {
      "name": "answer",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "answerKey",
            "type": "u64"
          },
          {
            "name": "answerTotalTokens",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "answerAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "answers",
            "type": {
              "vec": {
                "defined": {
                  "name": "answer"
                }
              }
            }
          },
          {
            "name": "exist",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "answerAdded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketKey",
            "type": "u64"
          },
          {
            "name": "newAnswers",
            "type": {
              "vec": "u64"
            }
          }
        ]
      }
    },
    {
      "name": "betPlaced",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "marketKey",
            "type": "pubkey"
          },
          {
            "name": "answerKey",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "bettingAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "marketKey",
            "type": "u64"
          },
          {
            "name": "answerKey",
            "type": "u64"
          },
          {
            "name": "voter",
            "type": "pubkey"
          },
          {
            "name": "tokens",
            "type": "u64"
          },
          {
            "name": "createTime",
            "type": "u64"
          },
          {
            "name": "exist",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "configAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "rewardMint",
            "type": "pubkey"
          },
          {
            "name": "rewardApr",
            "type": "u64"
          },
          {
            "name": "serviceFeeAccount",
            "type": "pubkey"
          },
          {
            "name": "remainAccount",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "marketAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "exist",
            "type": "bool"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "betMint",
            "type": "pubkey"
          },
          {
            "name": "marketKey",
            "type": "u64"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "marketStatus"
              }
            }
          },
          {
            "name": "creatorFee",
            "type": "u64"
          },
          {
            "name": "creatorFeePercentage",
            "type": "u64"
          },
          {
            "name": "serviceFeePercentage",
            "type": "u64"
          },
          {
            "name": "approveTime",
            "type": "u64"
          },
          {
            "name": "finishTime",
            "type": "u64"
          },
          {
            "name": "adjournTime",
            "type": "u64"
          },
          {
            "name": "successTime",
            "type": "u64"
          },
          {
            "name": "marketTotalTokens",
            "type": "u64"
          },
          {
            "name": "marketRemainTokens",
            "type": "u64"
          },
          {
            "name": "correctAnswerKey",
            "type": "u64"
          },
          {
            "name": "marketRewardBaseTokens",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "marketAdjourned",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketKey",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "marketApproved",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketKey",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "marketDrafted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "createFee",
            "type": "u64"
          },
          {
            "name": "creatorFeePercentage",
            "type": "u64"
          },
          {
            "name": "serviceFeePercentage",
            "type": "u64"
          },
          {
            "name": "approveTime",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "marketFinished",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketKey",
            "type": "u64"
          },
          {
            "name": "endTime",
            "type": "u64"
          },
          {
            "name": "remainTokens",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "marketStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "draft"
          },
          {
            "name": "approve"
          },
          {
            "name": "finished"
          },
          {
            "name": "success"
          },
          {
            "name": "adjourn"
          }
        ]
      }
    },
    {
      "name": "marketSuccess",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "marketKey",
            "type": "u64"
          },
          {
            "name": "answerKey",
            "type": "u64"
          },
          {
            "name": "creatorFee",
            "type": "u64"
          },
          {
            "name": "serviceFee",
            "type": "u64"
          },
          {
            "name": "marketRemainTokens",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "rewardClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "receiver",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "tokenClaimed",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "receiver",
            "type": "pubkey"
          },
          {
            "name": "marketKey",
            "type": "u64"
          },
          {
            "name": "bettingKey",
            "type": "u64"
          },
          {
            "name": "receivedTokens",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
