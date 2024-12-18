use anchor_lang::prelude::*;

pub mod constant;
pub mod error;
pub mod helper;
pub mod instructions;
pub mod states;

use instructions::*;

use states::*;

declare_id!("DQ31XNvikuu2gaQaxwSo2BpAkWiTWwTc6iEJcvjNLLBy");

#[program]
pub mod forecast_market {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        reward_mint: Pubkey,
        reward_apr: u64,
    ) -> Result<()> {
        instructions::initialize(ctx, reward_mint, reward_apr)?;
        Ok(())
    }

    pub fn update_owner(
        ctx: Context<UpdateOwner>,
        new_owner: Pubkey,
    ) -> Result<()> {
        instructions::update_owner(ctx, new_owner)?;
        Ok(())
    }

    pub fn set_account(
        ctx: Context<SetAccount>,
        service_fee_account: Option<Pubkey>,
        remain_account: Option<Pubkey>,
    ) -> Result<()> {
        instructions::set_account(ctx, service_fee_account, remain_account)?;
        Ok(())
    }

    pub fn update_reward_config(
        ctx: Context<UpdateRewardConfig>,
        reward_mint: Option<Pubkey>,
        reward_apr: Option<u64>,
    ) -> Result<()> {
        instructions::update_reward_config(ctx, reward_mint, reward_apr)?;
        Ok(())
    }

    pub fn draft_market(
        ctx: Context<DraftMarket>,
        market_key: u64,
        creator: Pubkey,
        title: String,
        create_fee: u64,
        creator_fee_percentage: u64,
        cojam_fee_percentage: u64,
    ) -> Result<()> {
        instructions::draft_market(
            ctx,
            market_key,
            creator,
            title,
            create_fee,
            creator_fee_percentage,
            cojam_fee_percentage,
        )?;
        Ok(())
    }

    pub fn approve_market(ctx: Context<ApproveMarket>) -> Result<()> {
        instructions::approve_market(ctx)?;
        Ok(())
    }

    pub fn adjourn_market(ctx: Context<AdjournMarket>) -> Result<()> {
        instructions::adjourn_market(ctx)?;
        Ok(())
    }

    pub fn finish_market(ctx: Context<FinishMarket>) -> Result<()> {
        instructions::finish_market(ctx)?;
        Ok(())
    }

    pub fn success_market(ctx: Context<SuccessMarket>, answer_key: u64) -> Result<()> {
        instructions::success_market(ctx, answer_key)?;
        Ok(())
    }

    pub fn add_answer_keys(ctx: Context<AddAnswer>, anwser_keys: Vec<u64>) -> Result<()> {
        instructions::add_answer_keys(ctx, anwser_keys)?;
        Ok(())
    }

    pub fn retrieve_tokens(ctx: Context<RetrieveTokens>) -> Result<()> {
        instructions::retrieve_tokens(ctx)?;
        Ok(())
    }

    pub fn bet(ctx: Context<Bet>, anwser_key: u64, amount: u64) -> Result<()> {
        instructions::bet(ctx, anwser_key, amount)?;
        Ok(())
    }

    pub fn claim_token(ctx: Context<ClaimToken>) -> Result<()> {
        instructions::claim_token(ctx)?;
        Ok(())
    }
}
