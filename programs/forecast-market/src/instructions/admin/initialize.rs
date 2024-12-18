use std::ops::DerefMut;

use anchor_lang::prelude::*;

use crate::{
    error::ProgramErrorCode,
    states::{ConfigAccount, CONFIG_SEED},
};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init_if_needed,
        payer = owner,
        space = ConfigAccount::LEN,
        seeds = [&CONFIG_SEED.as_bytes()],
        bump
    )]
    pub config_account: Account<'info, ConfigAccount>,

    pub system_program: Program<'info, System>,
}

pub fn initialize(ctx: Context<Initialize>, reward_mint: Pubkey, reward_apr: u64) -> Result<()> {
    let config_account = ctx.accounts.config_account.deref_mut();

    if config_account.is_initialized {
        return Err(ProgramErrorCode::AlreadyInitialized.into());
    }

    config_account.bump = ctx.bumps.config_account;
    config_account.is_initialized = true;
    config_account.reward_mint = reward_mint;
    config_account.owner = ctx.accounts.owner.key();
    config_account.reward_apr = reward_apr;

    Ok(())
}
