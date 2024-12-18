use std::ops::DerefMut;

use anchor_lang::prelude::*;

use crate::{error::ProgramErrorCode, ConfigAccount, MarketAccount, MarketStatus};

#[derive(Accounts)]
pub struct AdjournMarket<'info> {
    #[account(
      mut,
      constraint = (owner.key() == config_account.owner) @ ProgramErrorCode::Unauthorized
    )]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub config_account: Account<'info, ConfigAccount>,
    #[account(
      mut,
      constraint = market_account.status == MarketStatus::Finished @ ProgramErrorCode::MarketNotFinished
    )]
    pub market_account: Account<'info, MarketAccount>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct MarketAdjourned {
    pub market_key: u64,
}

pub fn adjourn_market(ctx: Context<AdjournMarket>) -> Result<()> {
    let market_account = ctx.accounts.market_account.deref_mut();

    let clock = Clock::get()?;

    market_account.status = MarketStatus::Adjourn;
    market_account.adjourn_time = clock.unix_timestamp as u64;

    emit!(MarketAdjourned {
        market_key: market_account.market_key.clone(),
    });

    Ok(())
}
