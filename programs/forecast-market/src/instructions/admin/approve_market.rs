use std::ops::DerefMut;

use anchor_lang::prelude::*;

use crate::{error::ProgramErrorCode, ConfigAccount, MarketAccount, MarketStatus};

#[derive(Accounts)]
pub struct ApproveMarket<'info> {
    #[account(
        mut,
        constraint = (owner.key() == config_account.owner) @ ProgramErrorCode::Unauthorized
    )]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub config_account: Account<'info, ConfigAccount>,
    #[account(mut)]
    pub market_account: Account<'info, MarketAccount>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct MarketApproved {
    pub market_key: u64,
}

pub fn approve_market(ctx: Context<ApproveMarket>) -> Result<()> {
    let market_account: &mut MarketAccount = ctx.accounts.market_account.deref_mut();

    market_account.status = MarketStatus::Approve;

    emit!(MarketApproved {
        market_key: market_account.market_key.clone(),
    });

    Ok(())
}
