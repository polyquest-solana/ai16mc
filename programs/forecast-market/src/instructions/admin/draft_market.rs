use std::ops::DerefMut;

use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

use crate::{error::ProgramErrorCode, ConfigAccount, MarketAccount, MARKET_SEED};

#[derive(Accounts)]
#[instruction(market_key: u64)]
pub struct DraftMarket<'info> {
    #[account(
        mut,
        constraint = (owner.key() == config_account.owner) @ ProgramErrorCode::Unauthorized
    )]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub bet_mint: Account<'info, Mint>,
    #[account(mut)]
    pub config_account: Account<'info, ConfigAccount>,
    #[account(
        init,
        payer = owner,
        space = MarketAccount::LEN,
        seeds = [MARKET_SEED.as_bytes(), &market_key.to_le_bytes()],
        bump,
    )]
    pub market_account: Account<'info, MarketAccount>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct MarketDrafted {
    pub creator: Pubkey,
    pub title: String,
    pub create_fee: u64,
    pub creator_fee_percentage: u64,
    pub service_fee_percentage: u64,
    pub approve_time: u64,
}

pub fn draft_market(
    ctx: Context<DraftMarket>,
    market_key: u64,
    creator: Pubkey,
    title: String,
    create_fee: u64,
    creator_fee_percentage: u64,
    service_fee_percentage: u64,
) -> Result<()> {
    let market_account = ctx.accounts.market_account.deref_mut();

    let clock = Clock::get()?;

    market_account.bump = ctx.bumps.market_account;
    market_account.bet_mint = ctx.accounts.bet_mint.key();
    market_account.creator = creator;
    market_account.title = title.clone();
    market_account.creator_fee = create_fee;
    market_account.creator_fee_percentage = creator_fee_percentage;
    market_account.service_fee_percentage = service_fee_percentage;
    market_account.approve_time = clock.unix_timestamp as u64;
    market_account.market_key = market_key;
    market_account.exist = true;

    emit!(MarketDrafted {
        creator,
        title,
        create_fee,
        creator_fee_percentage,
        service_fee_percentage,
        approve_time: clock.unix_timestamp as u64,
    });

    Ok(())
}
