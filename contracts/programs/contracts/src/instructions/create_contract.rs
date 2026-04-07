use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, Transfer};
use crate::constants::*;
use crate::error::TrustPayError;
use crate::state::*;

#[derive(Accounts)]
#[instruction(contract_id: String)]
pub struct CreateContract<'info> {
    #[account(
        init,
        payer = client,
        space = ContractAccount::space(),
        seeds = [CONTRACT_SEED, client.key().as_ref(), contract_id.as_bytes()],
        bump
    )]
    pub contract: Account<'info, ContractAccount>,

    #[account(
        init,
        payer = client,
        space = 8, // Initial space for the vault account
        seeds = [VAULT_SEED, contract.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, VaultAccount>,

    #[account(mut)]
    pub client: Signer<'info>,

    /// CHECK: This is the freelancer's wallet address, only stored for reference
    pub freelancer: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<CreateContract>,
    contract_id: String,
    title: String,
    milestones: Vec<MilestoneInput>,
    deadline_timestamp: i64,
) -> Result<()> {
    let contract = &mut ctx.accounts.contract;
    let clock = Clock::get()?;

    // 1. Validation Logic
    require!(!milestones.is_empty(), TrustPayError::NoMilestones);
    require!(milestones.len() <= MAX_MILESTONES, TrustPayError::TooManyMilestones);
    require!(
        deadline_timestamp > clock.unix_timestamp,
        TrustPayError::InvalidDeadline
    );

    let total_amount: u64 = milestones.iter().map(|m| m.amount).sum();
    require!(total_amount > 0, TrustPayError::ZeroAmount);

    // 2. ✅ FIXED CPI Transfer logic
    // We use .key() for the system_program instead of .to_account_info()
    let cpi_accounts = Transfer {
        from: ctx.accounts.client.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
    };
    
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.key(), 
        cpi_accounts,
    );
    system_program::transfer(cpi_ctx, total_amount)?;

    // 3. State initialization
    contract.contract_id = contract_id;
    contract.title = title;
    contract.client = ctx.accounts.client.key();
    contract.freelancer = ctx.accounts.freelancer.key();
    contract.total_amount = total_amount;
    contract.deadline = deadline_timestamp;
    contract.status = ContractStatus::Active;
    contract.created_at = clock.unix_timestamp;
    contract.bump = ctx.bumps.contract;
    contract.vault_bump = ctx.bumps.vault;

    // 4. Convert inputs to state milestones
    contract.milestones = milestones
        .into_iter()
        .enumerate()
        .map(|(i, m)| Milestone {
            index: i as u8,
            title: m.title,
            description: m.description,
            amount: m.amount,
            status: MilestoneStatus::Pending,
            submitted_at: None,
            approved_at: None,
        })
        .collect();

    Ok(())
}