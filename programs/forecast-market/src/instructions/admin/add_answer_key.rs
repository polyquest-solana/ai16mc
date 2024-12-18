use std::ops::DerefMut;

use anchor_lang::prelude::*;

use crate::{error::ProgramErrorCode, Answer, AnswerAccount, ConfigAccount, MarketAccount, ANSWER_SEED, MAX_ANWSER};

#[derive(Accounts)]
pub struct AddAnswer<'info> {
    #[account(
        mut,
        constraint = (owner.key() == config_account.owner) @ ProgramErrorCode::Unauthorized
    )]    
    pub owner: Signer<'info>,
    #[account(mut)]
    pub config_account: Account<'info, ConfigAccount>,
    #[account(mut)]
    pub market_account: Account<'info, MarketAccount>,
    #[account(        
      init_if_needed,
      payer = owner,
      space = MarketAccount::LEN,
      seeds = [ANSWER_SEED.as_bytes(), &market_account.market_key.to_le_bytes()],
      bump)
    ]
    pub answer_account: Account<'info, AnswerAccount>,
    pub system_program: Program<'info, System>,
}

#[event]
pub struct AnswerAdded {
    pub market_key: u64,
    pub new_answers: Vec<u64>,
}

pub fn add_answer_keys(ctx: Context<AddAnswer>, answer_keys: Vec<u64>) -> Result<()> {
    let answer_account = ctx.accounts.answer_account.deref_mut();

    if !answer_account.exist {
        answer_account.answers = Vec::with_capacity(MAX_ANWSER);
        answer_account.exist = true;
    }

    let mut new_answers = Vec::new();

    for answer_key in answer_keys {
        if answer_account.answers.iter().any(|answer| answer.answer_key == answer_key) {
            return Err(ProgramErrorCode::AnswerAlreadyExists.into());
        }

        if answer_account.answers.len() < MAX_ANWSER {
            answer_account.answers.push(Answer {
                answer_key,
                answer_total_tokens: 0,
            });
            new_answers.push(answer_key);
        } else {
            return Err(ProgramErrorCode::MaxAnswersReached.into());
        }
    }

    if !new_answers.is_empty() {
        emit!(AnswerAdded {
            market_key: ctx.accounts.market_account.market_key,
            new_answers,
        });
    }

    Ok(())
}