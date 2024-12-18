use std::ops::DerefMut;

use anchor_lang::prelude::*;

use crate::{error::ProgramErrorCode, ConfigAccount, MarketAccount, MarketStatus};

#[derive(Accounts)]
pub struct FinishMarket<'info> {
    #[account(
        mut,
        constraint = (owner.key() == config_account.owner) @ ProgramErrorCode::Unauthorized
    )]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub config_account: Account<'info, ConfigAccount>,
    #[account(
      mut,
      constraint = market_account.status == MarketStatus::Approve @ ProgramErrorCode::MarketNotApproved
    )]
    pub market_account: Account<'info, MarketAccount>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct MarketFinished {
    pub market_key: u64,
    pub end_time: u64,
    pub remain_tokens: u64
}

pub fn finish_market(ctx: Context<FinishMarket>) -> Result<()> {
    let market_account = ctx.accounts.market_account.deref_mut();
    let clock = Clock::get()?;
    market_account.status = MarketStatus::Finished;

    market_account.finish_time = clock.unix_timestamp as u64;
    market_account.market_remain_tokens = market_account.market_total_tokens;

    emit!(MarketFinished {
        market_key: market_account.market_key.clone(),
        end_time: clock.unix_timestamp as u64,
        remain_tokens: market_account.market_remain_tokens
    });

    Ok(())
}
