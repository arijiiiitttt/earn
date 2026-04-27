pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

use instructions::create_contract::*;
use instructions::submit_milestone::*;
use instructions::approve_milestone::*;
use instructions::auto_release::*;
use instructions::raise_dispute::*;
use instructions::cancel_contract::*;

// Import shared state
use state::*;

declare_id!("9P5As689sXoe2mJv4X3NAcgcQ8zbasg3Gf1vTWpB77BB");

#[program]
pub mod contracts {
    use super::*;

    pub fn create_contract(
        ctx: Context<CreateContract>,
        contract_id: String,
        title: String,
        milestones: Vec<MilestoneInput>,
        deadline_timestamp: i64,
    ) -> Result<()> {
        instructions::create_contract::handler(ctx, contract_id, title, milestones, deadline_timestamp)
    }

    pub fn submit_milestone(
        ctx: Context<SubmitMilestone>,
        milestone_index: u8,
        submission_note: String,
    ) -> Result<()> {
        instructions::submit_milestone::handler(ctx, milestone_index, submission_note)
    }

    pub fn approve_milestone(
        ctx: Context<ApproveMilestone>,
        milestone_index: u8,
    ) -> Result<()> {
        instructions::approve_milestone::handler(ctx, milestone_index)
    }

    pub fn auto_release(
        ctx: Context<AutoRelease>,
        milestone_index: u8,
    ) -> Result<()> {
        instructions::auto_release::handler(ctx, milestone_index)
    }

    pub fn raise_dispute(
        ctx: Context<RaiseDispute>,
        milestone_index: u8,
        reason: String,
    ) -> Result<()> {
        instructions::raise_dispute::handler(ctx, milestone_index, reason)
    }

    pub fn cancel_contract(ctx: Context<CancelContract>) -> Result<()> {
        instructions::cancel_contract::handler(ctx)
    }
}