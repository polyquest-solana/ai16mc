use anchor_lang::prelude::*;

pub const CONFIG_SEED: &str = "config";
#[account]
pub struct ConfigAccount {
    pub bump: u8,
    pub is_initialized: bool,
    pub owner: Pubkey,
    pub reward_mint: Pubkey,
    pub reward_apr: u64,
    pub service_fee_account: Pubkey,
    pub remain_account: Pubkey,
}

impl ConfigAccount {
    pub const LEN: usize = 8 // Account discriminator added by Anchor for each account
            + 1 // bump
            + 1 //is_initialized
            + 32 //owner
            + 32 //reward mint
            + 8 //reward_apr
            + 32 //service_fee_account
            + 32; //remain_account
}
