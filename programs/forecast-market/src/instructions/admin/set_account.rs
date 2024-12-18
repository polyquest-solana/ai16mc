use std::ops::DerefMut;

use crate::{
    error::ProgramErrorCode,
    states::{ConfigAccount, CONFIG_SEED},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetAccount<'info> {
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

pub fn set_account(
    ctx: Context<SetAccount>,
    service_fee_account: Option<Pubkey>,
    remain_account: Option<Pubkey>,
) -> Result<()> {
    let config_account = ctx.accounts.config_account.deref_mut();

    // Update service_fee_account if provided
    if let Some(service_fee_account) = service_fee_account {
        config_account.service_fee_account = service_fee_account;
    }

    // Update remain_account if provided
    if let Some(remain_account) = remain_account {
        config_account.remain_account = remain_account;
    }

    Ok(())
}
