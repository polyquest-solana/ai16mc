use anchor_lang::prelude::*;
pub const BETTING_SEED: &str = "betting";

#[account]
pub struct BettingAccount {
    pub bump: u8, //bump for identify
    pub market_key: u64,
    pub answer_key: u64,
    pub voter: Pubkey,
    pub tokens: u64,
    pub create_time: u64,
    pub exist: bool,
}

impl BettingAccount {
    pub const MAX_SIZE: usize = 8 + // discriminator
        1 + // bump
        8 + // market_key
        8 + // answer_key
        32 + // voter (Pubkey)
        8 + // tokens
        8 + // create_time (i64)
        1; // exist (bool)
}
