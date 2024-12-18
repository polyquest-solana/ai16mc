use anchor_lang::prelude::*;

pub const MAX_ANWSER: usize = 200;

pub const ANSWER_SEED: &str = "answer";

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Answer {
    pub answer_key: u64,
    pub answer_total_tokens: u64,
}

#[account]
pub struct AnswerAccount {
    pub bump: u8,
    pub answers: Vec<Answer>,
    pub exist: bool,
}

impl AnswerAccount {
    pub const MAX_SIZE: usize = 8 + 1 + 4 + (8 + 8) * MAX_ANWSER + 1;
}
