use anchor_lang::prelude::*;
use crate::constants::VAULT_SEED;
use crate::error::TrustPayError;
use crate::state::*;

#[derive(Accounts)]
pub struct AutoRelease<'info> {
    #[account(mut, has_one = freelancer)]
    pub contract: Account<'info, ContractAccount>,

    #[account(
        mut,
        seeds = [VAULT_SEED, contract.key().as_ref()],
        bump = contract.vault_bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub freelancer: Signer<'info>,
}

pub fn handler(ctx: Context<AutoRelease>, milestone_index: u8) -> Result<()> {
    let contract = &mut ctx.accounts.contract;
    let clock = Clock::get()?;

    require!(clock.unix_timestamp > contract.deadline, TrustPayError::DeadlineNotPassed);

    let amount = {
        let milestone = contract
            .milestones
            .get_mut(milestone_index as usize)
            .ok_or(TrustPayError::MilestoneNotFound)?;

        require!(milestone.status == MilestoneStatus::Submitted, TrustPayError::MilestoneNotSubmitted);

        milestone.status = MilestoneStatus::Approved;
        milestone.approved_at = Some(clock.unix_timestamp);
        milestone.amount
    };

    **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.freelancer.to_account_info().try_borrow_mut_lamports()? += amount;

    emit!(AutoReleaseTriggered {
        contract_id: contract.contract_id.clone(),
        milestone_index,
        amount,
        freelancer: ctx.accounts.freelancer.key(),
    });

    Ok(())
}