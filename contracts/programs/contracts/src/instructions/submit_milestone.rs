use anchor_lang::prelude::*;
use crate::error::TrustPayError;
use crate::state::*;

#[derive(Accounts)]
pub struct SubmitMilestone<'info> {
    #[account(mut, has_one = freelancer)]
    pub contract: Account<'info, ContractAccount>,

    #[account(mut)]
    pub freelancer: Signer<'info>,
}

pub fn handler(
    ctx: Context<SubmitMilestone>,
    milestone_index: u8,
    submission_note: String,
) -> Result<()> {
    let contract = &mut ctx.accounts.contract;
    let clock = Clock::get()?;

    require!(contract.status == ContractStatus::Active, TrustPayError::ContractNotActive);

    let milestone = contract
        .milestones
        .get_mut(milestone_index as usize)
        .ok_or(TrustPayError::MilestoneNotFound)?;

    require!(milestone.status == MilestoneStatus::Pending, TrustPayError::MilestoneAlreadySubmitted);

    milestone.status = MilestoneStatus::Submitted;
    milestone.submitted_at = Some(clock.unix_timestamp);

    emit!(MilestoneSubmitted {
        contract_id: contract.contract_id.clone(),
        milestone_index,
        submission_note,
        freelancer: ctx.accounts.freelancer.key(),
    });

    Ok(())
}