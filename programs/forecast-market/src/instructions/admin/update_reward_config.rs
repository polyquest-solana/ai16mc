use std::ops::DerefMut;

use crate::{
    error::ProgramErrorCode,
    states::{ConfigAccount, CONFIG_SEED},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateRewardConfig<'info> {
    #[account(
    mut,
    constraint = (owner.key() == config_account.owner) @ ProgramErrorCode::Unauthorized
)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        seeds = [&CONFIG_SEED.as_bytes()],
        bump = config_account.bump,
    )]
    pub config_account: Account<'info, ConfigAccount>,
}

pub fn update_reward_config(
    ctx: Context<UpdateRewardConfig>,
    reward_mint: Option<Pubkey>,
    reward_apr: Option<u64>,
) -> Result<()> {
    let config_account = ctx.accounts.config_account.deref_mut();

    // Update reward_mint if provided
    if let Some(reward_mint) = reward_mint {
        config_account.reward_mint = reward_mint;
    }

    // Update reward_apr if provided
    if let Some(reward_apr) = reward_apr {
        config_account.reward_apr = reward_apr;
    }

    Ok(())
}
