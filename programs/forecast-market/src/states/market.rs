use anchor_lang::prelude::*;

pub const MARKET_SEED: &str = "market";

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum MarketStatus {
    Draft,
    Approve,
    Finished,
    Success,
    Adjourn,
}

#[account]

pub struct MarketAccount {
    pub bump: u8,
    pub exist: bool,
    pub creator: Pubkey,
    pub bet_mint: Pubkey,
    pub market_key: u64,
    pub title: String,
    pub status: MarketStatus,
    pub creator_fee: u64,
    pub creator_fee_percentage: u64,
    pub service_fee_percentage: u64,
    pub approve_time: u64,
    pub finish_time: u64,
    pub adjourn_time: u64,
    pub success_time: u64,
    pub market_total_tokens: u64,
    pub market_remain_tokens: u64,
    pub correct_answer_key: u64,
    pub market_reward_base_tokens: u64,
}

impl MarketAccount {
    pub const LEN: usize = 8 + // discriminator
        1 + // bump
        32 + // creator
        32 + // bet mint
        8 + //market key
        MAX_TITLE_LEN + //title 
        1 + // status - MarketStatus (as u8)
        8 + // creator_fee - u64
        8 + // creator_fee_percentage - u64
        8 + // cojam_fee_percentage - u64
        8 + // approve_time - u64
        8 + // finish_time - u64
        8 + // adjourn_time - u64
        8 + // success_time - u64
        8 + // market_total_tokens - u64
        8 + // market_remain_tokens - u64
        8 + // correct_answer_key - u64
        8 + // market_reward_base_tokens - u64
        1; // exist - bool

}

pub const MAX_MARKET_KEY: usize = 100;

pub const MAX_TITLE_LEN: usize = 100;
