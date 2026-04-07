use anchor_lang::prelude::*;
use crate::constants::VAULT_SEED;
use crate::error::TrustPayError;
use crate::state::*;

#[derive(Accounts)]
pub struct CancelContract<'info> {
    #[account(mut, has_one = client)]
    pub contract: Account<'info, ContractAccount>,

    #[account(
        mut,
        seeds = [VAULT_SEED, contract.key().as_ref()],
        bump = contract.vault_bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub client: Signer<'info>,
}

pub fn handler(ctx: Context<CancelContract>) -> Result<()> {
    let contract = &mut ctx.accounts.contract;

    require!(contract.client == ctx.accounts.client.key(), TrustPayError::Unauthorized);

    let any_submitted = contract
        .milestones
        .iter()
        .any(|m| m.status != MilestoneStatus::Pending);

    require!(!any_submitted, TrustPayError::CannotCancelAfterSubmission);

    let vault_balance = ctx.accounts.vault.to_account_info().lamports();
    if vault_balance > 0 {
        **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= vault_balance;
        **ctx.accounts.client.to_account_info().try_borrow_mut_lamports()? += vault_balance;
    }

    contract.status = ContractStatus::Cancelled;

    emit!(ContractCancelled {
        contract_id: contract.contract_id.clone(),
        client: ctx.accounts.client.key(),
        refunded: vault_balance,
    });

    Ok(())
}