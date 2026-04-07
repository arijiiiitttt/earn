use anchor_lang::prelude::*;

#[error_code]
pub enum TrustPayError {
    #[msg("Unauthorized: you are not a party to this contract")]
    Unauthorized,

    #[msg("Contract is not active")]
    ContractNotActive,

    #[msg("No milestones provided")]
    NoMilestones,

    #[msg("Maximum 10 milestones allowed")]
    TooManyMilestones,

    #[msg("Total amount must be greater than zero")]
    ZeroAmount,

    #[msg("Deadline must be in the future")]
    InvalidDeadline,

    #[msg("Milestone not found")]
    MilestoneNotFound,

    #[msg("Milestone already submitted or completed")]
    MilestoneAlreadySubmitted,

    #[msg("Milestone has not been submitted yet")]
    MilestoneNotSubmitted,

    #[msg("Deadline has not passed yet")]
    DeadlineNotPassed,

    #[msg("Cannot cancel after work has been submitted")]
    CannotCancelAfterSubmission,
}