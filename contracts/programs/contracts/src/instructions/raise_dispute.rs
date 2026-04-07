use anchor_lang::prelude::*;
use crate::error::TrustPayError;
use crate::state::*;

#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    #[account(mut, has_one = client)]
    pub contract: Account<'info, ContractAccount>,

    #[account(mut)]
    pub client: Signer<'info>,
}

pub fn handler(ctx: Context<RaiseDispute>, milestone_index: u8, reason: String) -> Result<()> {
    let contract = &mut ctx.accounts.contract;

    let milestone = contract
        .milestones
        .get_mut(milestone_index as usize)
        .ok_or(TrustPayError::MilestoneNotFound)?;

    require!(milestone.status == MilestoneStatus::Submitted, TrustPayError::MilestoneNotSubmitted);

    milestone.status = MilestoneStatus::Disputed;
    contract.status = ContractStatus::Disputed;

    emit!(DisputeRaised {
        contract_id: contract.contract_id.clone(),
        milestone_index,
        reason,
        client: ctx.accounts.client.key(),
    });

    Ok(())
}