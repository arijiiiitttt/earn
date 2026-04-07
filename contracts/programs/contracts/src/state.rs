use anchor_lang::prelude::*;
use crate::constants::*;

#[account]
pub struct ContractAccount {
    pub contract_id: String,
    pub title: String,
    pub client: Pubkey,
    pub freelancer: Pubkey,
    pub total_amount: u64,
    pub deadline: i64,
    pub status: ContractStatus,
    pub milestones: Vec<Milestone>,
    pub created_at: i64,
    pub bump: u8,
    pub vault_bump: u8,
}

impl ContractAccount {
    pub fn space() -> usize {
        8 +
        4 + MAX_CONTRACT_ID_LEN +
        4 + MAX_TITLE_LEN +
        32 +
        32 +
        8 +
        8 +
        1 +
        4 + (MAX_MILESTONES * Milestone::SIZE) +
        8 +
        1 +
        1
    }
}

#[account]
pub struct VaultAccount {}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct Milestone {
    pub index: u8,
    pub title: String,
    pub description: String,
    pub amount: u64,
    pub status: MilestoneStatus,
    pub submitted_at: Option<i64>,
    pub approved_at: Option<i64>,
}

impl Milestone {
    pub const SIZE: usize =
        1 +
        4 + MAX_MILESTONE_TITLE_LEN +
        4 + MAX_MILESTONE_DESC_LEN +
        8 +
        1 +
        9 +
        9;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct MilestoneInput {
    pub title: String,
    pub description: String,
    pub amount: u64,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum ContractStatus {
    Active,
    Completed,
    Disputed,
    Cancelled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    Approved,
    Disputed,
}

#[event]
pub struct ContractCreated {
    pub contract_id: String,
    pub client: Pubkey,
    pub freelancer: Pubkey,
    pub total_amount: u64,
    pub deadline: i64,
}

#[event]
pub struct MilestoneSubmitted {
    pub contract_id: String,
    pub milestone_index: u8,
    pub submission_note: String,
    pub freelancer: Pubkey,
}

#[event]
pub struct MilestoneApproved {
    pub contract_id: String,
    pub milestone_index: u8,
    pub amount: u64,
    pub freelancer: Pubkey,
}

#[event]
pub struct AutoReleaseTriggered {
    pub contract_id: String,
    pub milestone_index: u8,
    pub amount: u64,
    pub freelancer: Pubkey,
}

#[event]
pub struct DisputeRaised {
    pub contract_id: String,
    pub milestone_index: u8,
    pub reason: String,
    pub client: Pubkey,
}

#[event]
pub struct ContractCancelled {
    pub contract_id: String,
    pub client: Pubkey,
    pub refunded: u64,
}