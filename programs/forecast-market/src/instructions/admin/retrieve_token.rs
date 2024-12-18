use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Token, TokenAccount},
};

use crate::{
    error::ProgramErrorCode,
    helper::{is_retrieve_available, transfer_token_from_pool_to_user},
    ConfigAccount, MarketAccount, MARKET_SEED,
};

#[derive(Accounts)]
pub struct RetrieveTokens<'info> {
    #[account(
        mut,
        constraint = (owner.key() == config_account.owner) @ ProgramErrorCode::Unauthorized
    )]
    pub owner: Signer<'info>,
    #[account(mut)]
    pub config_account: Account<'info, ConfigAccount>,
    #[account(mut)]
    pub vault_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub remains_token_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub market_account: Account<'info, MarketAccount>,
    pub token_program: Program<'info, Token>,
    pub associate_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn retrieve_tokens(ctx: Context<RetrieveTokens>) -> Result<()> {
    let market_account = &mut ctx.accounts.market_account;

    let clock = Clock::get()?;

    let can_retrieve = is_retrieve_available(market_account, &clock)?;
    require!(can_retrieve, ProgramErrorCode::CannotRetrieveBeforeDate);

    let remains_amount = market_account.market_remain_tokens;

    let seeds: &[&[u8]] = &[
        MARKET_SEED.as_bytes(),
        &market_account.market_key.to_le_bytes(),
        &[market_account.bump],
    ];

    transfer_token_from_pool_to_user(
        ctx.accounts.vault_token_account.to_account_info(),
        ctx.accounts.remains_token_account.to_account_info(),
        market_account.to_account_info(),
        ctx.accounts.token_program.to_account_info(),
        &[&seeds],
        remains_amount,
    )?;

    Ok(())
}
