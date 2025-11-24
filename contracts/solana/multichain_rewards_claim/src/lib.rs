use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("11111111111111111111111111111111");

#[program]
pub mod multichain_rewards_claim {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        reward_rate_per_thousand_points: u64,
        backend_signer: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.reward_token_mint = ctx.accounts.reward_token_mint.key();
        config.reward_rate_per_thousand_points = reward_rate_per_thousand_points;
        config.backend_signer = backend_signer;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    pub fn claim_reward(
        ctx: Context<ClaimReward>,
        user_points: u64,
        _signature: Vec<u8>,
    ) -> Result<()> {
        let user_claim = &mut ctx.accounts.user_claim;
        let config = &ctx.accounts.config;
        let clock = Clock::get()?;

        // Check if 24 hours have passed since last claim
        require!(
            clock.unix_timestamp >= user_claim.last_claim_timestamp + 86400,
            ErrorCode::AlreadyClaimedToday
        );

        // Require at least 1000 points
        require!(user_points >= 1000, ErrorCode::InsufficientPoints);

        // Calculate reward amount
        let thousand_points_multiplier = user_points / 1000;
        let reward_amount = thousand_points_multiplier
            .checked_mul(config.reward_rate_per_thousand_points)
            .ok_or(ErrorCode::MathOverflow)?;

        require!(reward_amount > 0, ErrorCode::NoRewardsAvailable);

        // Transfer tokens from vault to user
        let seeds = &[
            b"config",
            config.reward_token_mint.as_ref(),
            &[config.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.user_token_account.to_account_info(),
            authority: ctx.accounts.config.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, reward_amount)?;

        // Update claim record
        user_claim.last_claim_timestamp = clock.unix_timestamp;
        user_claim.total_claimed = user_claim
            .total_claimed
            .checked_add(reward_amount)
            .ok_or(ErrorCode::MathOverflow)?;

        emit!(RewardClaimed {
            user: ctx.accounts.user.key(),
            amount: reward_amount,
            timestamp: clock.unix_timestamp,
        });

        Ok(())
    }

    pub fn update_reward_rate(
        ctx: Context<UpdateConfig>,
        new_rate: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.reward_rate_per_thousand_points = new_rate;
        Ok(())
    }

    pub fn update_backend_signer(
        ctx: Context<UpdateConfig>,
        new_signer: Pubkey,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        config.backend_signer = new_signer;
        Ok(())
    }

    pub fn withdraw_tokens(ctx: Context<WithdrawTokens>, amount: u64) -> Result<()> {
        let config = &ctx.accounts.config;
        let seeds = &[
            b"config",
            config.reward_token_mint.as_ref(),
            &[config.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.config.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config", reward_token_mint.key().as_ref()],
        bump
    )]
    pub config: Account<'info, Config>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    /// CHECK: Reward token mint
    pub reward_token_mint: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(
        seeds = [b"config", config.reward_token_mint.as_ref()],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + UserClaim::INIT_SPACE,
        seeds = [b"user_claim", user.key().as_ref(), config.reward_token_mint.as_ref()],
        bump
    )]
    pub user_claim: Account<'info, UserClaim>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        constraint = vault.mint == config.reward_token_mint,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key(),
        constraint = user_token_account.mint == config.reward_token_mint,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(
        mut,
        seeds = [b"config", config.reward_token_mint.as_ref()],
        bump = config.bump,
        constraint = config.authority == authority.key()
    )]
    pub config: Account<'info, Config>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawTokens<'info> {
    #[account(
        seeds = [b"config", config.reward_token_mint.as_ref()],
        bump = config.bump,
        constraint = config.authority == authority.key()
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        constraint = vault.mint == config.reward_token_mint,
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,

    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct Config {
    pub authority: Pubkey,
    pub reward_token_mint: Pubkey,
    pub reward_rate_per_thousand_points: u64,
    pub backend_signer: Pubkey,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserClaim {
    pub last_claim_timestamp: i64,
    pub total_claimed: u64,
}

#[event]
pub struct RewardClaimed {
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Already claimed today. Wait 24 hours.")]
    AlreadyClaimedToday,
    #[msg("Need at least 1000 points to claim rewards.")]
    InsufficientPoints,
    #[msg("No rewards available.")]
    NoRewardsAvailable,
    #[msg("Math overflow occurred.")]
    MathOverflow,
    #[msg("Invalid signature.")]
    InvalidSignature,
}
