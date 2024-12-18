use std::ops::DerefMut;

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount},
};

use crate::{
    constant::MAX_PERCENTAGE_BASIS_POINTS,
    error::ProgramErrorCode,
    helper::{calculate_reward_amount, transfer_token_from_pool_to_user},
    AnswerAccount, BettingAccount, ConfigAccount, MarketAccount, MarketStatus, CONFIG_SEED,
    MARKET_SEED,
};

#[derive(Accounts)]
pub struct ClaimToken<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,
    #[account(mut)]
    pub config_account: Account<'info, ConfigAccount>,
    #[account(mut)]
    pub bet_mint: Account<'info, Mint>,
    #[account(mut)]
    pub reward_mint: Account<'info, Mint>,
    #[account(mut)]
    pub user_bet_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = bet_mint,
        token::authority = market_account
    )]
    pub vault_bet_token_account: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = voter,
        associated_token::mint = reward_mint,
        associated_token::authority = voter
    )]
    pub user_reward_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = reward_mint,
        token::authority = config_account
    )]
    pub vault_reward_token_account: Account<'info, TokenAccount>,
    #[account(
      mut,
      constraint = market_account.status == MarketStatus::Success || market_account.status == MarketStatus::Adjourn @ ProgramErrorCode::CannotClaimToken,
      constraint = market_account.bet_mint == bet_mint.key() @ ProgramErrorCode::InvalidBetMint,
    )]
    pub market_account: Account<'info, MarketAccount>,
    #[account(mut)]
    pub bet_account: Account<'info, BettingAccount>,

    #[account(mut)]
    pub answer_account: Account<'info, AnswerAccount>,

    pub token_program: Program<'info, Token>,

    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,
}

#[event]
pub struct TokenClaimed {
    pub receiver: Pubkey,
    pub market_key: u64,
    pub betting_key: u64,
    pub received_tokens: u64,
}

#[event]
pub struct RewardClaimed {
    pub receiver: Pubkey,
    pub amount: u64,
}

pub fn claim_token(ctx: Context<ClaimToken>) -> Result<()> {
    let market_account = ctx.accounts.market_account.deref_mut();

    let config_account = &ctx.accounts.config_account;
    let betting_account = &ctx.accounts.bet_account;
    let answer_account = &ctx.accounts.answer_account;

    let correct_answer_key = market_account.correct_answer_key;
    let betting_tokens = betting_account.tokens as u128;
    let finish_time = market_account.finish_time;

    if market_account.status == MarketStatus::Success
        && betting_account.answer_key == correct_answer_key
    {
        let mut correct_answer_total_tokens: u128 = 0;
        for answer in &answer_account.answers {
            if answer.answer_key == correct_answer_key {
                correct_answer_total_tokens = answer.answer_total_tokens as u128;
                break;
            }
        }

        let market_reward_base_tokens = market_account.market_reward_base_tokens as u128;
        let percentage = market_reward_base_tokens
            .checked_mul(MAX_PERCENTAGE_BASIS_POINTS)
            .and_then(|result| result.checked_div(correct_answer_total_tokens))
            .ok_or(ProgramErrorCode::MathOperationError)?;

        let receive_tokens = betting_tokens
            .checked_mul(percentage)
            .and_then(|result| result.checked_div(MAX_PERCENTAGE_BASIS_POINTS))
            .ok_or(ProgramErrorCode::MathOperationError)?;

        //dividend token to user
        market_account.market_remain_tokens =
            market_account.market_remain_tokens - receive_tokens as u64;

        let bet_seeds: &[&[u8]] = &[
            MARKET_SEED.as_bytes(),
            &ctx.accounts.market_account.market_key.to_le_bytes(),
            &[ctx.accounts.market_account.bump],
        ];

        transfer_token_from_pool_to_user(
            ctx.accounts.vault_bet_token_account.to_account_info(),
            ctx.accounts.user_bet_token_account.to_account_info(),
            ctx.accounts.market_account.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            &[&bet_seeds],
            receive_tokens as u64,
        )?;

        emit!(TokenClaimed {
            receiver: ctx.accounts.voter.key(),
            market_key: ctx.accounts.market_account.market_key,
            betting_key: betting_account.answer_key,
            received_tokens: receive_tokens as u64,
        });
    }

    let reward_seeds: &[&[u8]] = &[CONFIG_SEED.as_bytes(), &[ctx.accounts.config_account.bump]];

    let reward_amount = calculate_reward_amount(
        betting_account.tokens,
        config_account.reward_apr,
        betting_account.create_time,
        finish_time,
    )?;

    if reward_amount > 0 {
        transfer_token_from_pool_to_user(
            ctx.accounts.vault_reward_token_account.to_account_info(),
            ctx.accounts.user_reward_token_account.to_account_info(),
            ctx.accounts.config_account.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            &[&reward_seeds],
            reward_amount,
        )?;

        emit!(RewardClaimed {
            receiver: ctx.accounts.voter.key(),
            amount: reward_amount
        })
    }

    Ok(())
}
