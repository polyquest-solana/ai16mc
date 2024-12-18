use std::ops::DerefMut;

use crate::{
    error::ProgramErrorCode,
    states::{ConfigAccount, CONFIG_SEED},
};
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateOwner<'info> {
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

pub fn update_owner(
    ctx: Context<UpdateOwner>,
    new_owner: Pubkey,
) -> Result<()> {
    let config_account = ctx.accounts.config_account.deref_mut();

    config_account.owner = new_owner;

    Ok(())
}
