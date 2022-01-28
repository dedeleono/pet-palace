use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("AH8QQSG2frNPYo9Ckqo9jzrPUixCQGJgL2jsApS3Kvkx");

// Data Logics

#[program]
pub mod nft_staker {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, jolly_bump: u8, spl_bump: u8) -> ProgramResult {
        msg!("initializer ran from anchor log");
        let jollyranch = &mut ctx.accounts.jollyranch;
        jollyranch.authority = ctx.accounts.authority.key();
        jollyranch.amount = 0;
        jollyranch.amount_redeemed = 0;
        jollyranch.bump = jolly_bump;
        jollyranch.spl_bump = spl_bump;
        Ok(())
    }

    pub fn fund_ranch(ctx: Context<FundRanch>, amount: u64) -> ProgramResult {
        // msg!("Funder starting tokens: {}", ctx.accounts.sender_spl_account.amount);
        token::transfer(ctx.accounts.transfer_ctx(), amount)?;
        // ctx.accounts.sender_spl_account.reload()?;
        // msg!("Funder ending tokens: {}", ctx.accounts.sender_spl_account.amount);
        let jollyranch = &mut ctx.accounts.jollyranch;
        jollyranch.amount += amount;
        Ok(())
    }

    pub fn stake_nft(ctx: Context<StakeNFT>, spl_bump: u8) -> ProgramResult {
        let clock = Clock::get().unwrap();
        msg!(
            "Staker nft mint: {:?}",
            ctx.accounts.sender_spl_account.mint
        );
        msg!(
            "Staker nft owner: {:?}",
            ctx.accounts.sender_spl_account.owner
        );
        msg!(
            "Staker nft ref: {:?}",
            ctx.accounts.sender_spl_account.as_ref()
        );
        msg!(
            "Staker nft key: {:?}",
            ctx.accounts.sender_spl_account.key()
        );
        token::transfer(ctx.accounts.transfer_ctx(), 1)?;

        let stake = &mut ctx.accounts.stake;
        stake.authority = ctx.accounts.authority.key();
        stake.mint = ctx.accounts.mint.key();
        stake.start_date = clock.unix_timestamp;
        stake.spl_bump = spl_bump;
        stake.amount_owed = 0;
        stake.amount_redeemed = 0;

        Ok(())
    }

    pub fn redeem_rewards(ctx: Context<RedeemRewards>) -> ProgramResult {
        let stake = &mut ctx.accounts.stake;
        let jollyranch = &mut ctx.accounts.jollyranch;

        if jollyranch.amount_redeemed >= jollyranch.amount {
            return Err(ErrorCode::OutOfFunds.into());
        }

        let clock_unix = Clock::get().unwrap().unix_timestamp;
        // redemption rate for a token with 9 decimals
        let mut redemption_rate = 6.9;

        let mint = stake.mint.to_string();
        let mint_list: Vec<_> = vec![
            "9Gd3CpPFgK5PbfRnEuhF2JmDSUFEyWkHPkB7GA4SfSdA",
            "APA8t9faSRNdZvB1opJvB5DQ8h3aeCFyNxZiaCMSArTZ",
            "FrLGhta8fHTcyFTqiTDUwiDiG59L5xnvnqJwS2ssVXu7",
            "662zoahSfHgZYjQ9bzcS8MzqRfsF2H1h549uZUebC4e6",
            "Fs9SpcHN8J7PN8gjmp7Xvhae8EA4Zwifa79eNCQHJNgW",
            "4j99GW37LGL1Er7otAsqRdWgNDt9srZguim9n4rFCoDj",
        ]
        .into_iter()
        .map(String::from)
        .collect();
        if mint_list.contains(&mint) {
            redemption_rate = 16.9;
        }

        // msg!("redemption_rate {}", redemption_rate);
        // msg!("clock_unix {}", clock_unix);
        // msg!("stake.start_date {}", stake.start_date);
        let day_dif = (clock_unix - stake.start_date).abs() as f64;
        // msg!("day_dif {}", day_dif);
        let to_days = 60.0 * 60.0 * 24.0;
        // msg!("to_days {}", to_days);
        let days_elapsed: f64 = day_dif / to_days;
        // msg!("days elapsed {}", days_elapsed);
        let amount_to_redeem = redemption_rate * days_elapsed;
        // msg!("Amount in token to redeem {}", amount_to_redeem);
        let typed_amount = ((amount_to_redeem * 1e6) as u64) - stake.amount_redeemed;
        // msg!("typed_amount {}", typed_amount);
        stake.amount_redeemed += typed_amount;
        jollyranch.amount_redeemed += typed_amount;
        // new hotness is borken
        // token::transfer(ctx.accounts.transfer_ctx(), amount_to_redeem)?;
        // ol reliable?
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.sender_spl_account.to_account_info(),
                    to: ctx.accounts.reciever_spl_account.to_account_info(),
                    authority: ctx.accounts.sender_spl_account.to_account_info(),
                },
                &[&[
                    ctx.accounts.jollyranch.key().as_ref(),
                    &[ctx.accounts.jollyranch.spl_bump],
                ]],
            ),
            typed_amount,
        )?;
        Ok(())
    }

    pub fn redeem_nft(ctx: Context<RedeemNFT>) -> ProgramResult {
        let stake = &mut ctx.accounts.stake;
        let jollyranch = &mut ctx.accounts.jollyranch;

        if jollyranch.amount_redeemed >= jollyranch.amount {
            return Err(ErrorCode::OutOfFunds.into());
        }

        let clock_unix = Clock::get().unwrap().unix_timestamp;
        // redemption rate for a token with 9 decimals
        let mut redemption_rate = 6.9;

        let mint = stake.mint.to_string();
        let mint_list: Vec<_> = vec![
            "9Gd3CpPFgK5PbfRnEuhF2JmDSUFEyWkHPkB7GA4SfSdA",
            "APA8t9faSRNdZvB1opJvB5DQ8h3aeCFyNxZiaCMSArTZ",
            "FrLGhta8fHTcyFTqiTDUwiDiG59L5xnvnqJwS2ssVXu7",
            "662zoahSfHgZYjQ9bzcS8MzqRfsF2H1h549uZUebC4e6",
            "Fs9SpcHN8J7PN8gjmp7Xvhae8EA4Zwifa79eNCQHJNgW",
            "4j99GW37LGL1Er7otAsqRdWgNDt9srZguim9n4rFCoDj",
        ]
        .into_iter()
        .map(String::from)
        .collect();
        if mint_list.contains(&mint) {
            redemption_rate = 16.9;
        }

        // msg!("redemption_rate {}", redemption_rate);
        // msg!("clock_unix {}", clock_unix);
        // msg!("stake.start_date {}", stake.start_date);
        let day_dif = (clock_unix - stake.start_date).abs() as f64;
        // msg!("day_dif {}", day_dif);
        let to_days = 60.0 * 60.0 * 24.0;
        // msg!("to_days {}", to_days);
        let days_elapsed: f64 = day_dif / to_days;
        // msg!("days elapsed {}", days_elapsed);
        let amount_to_redeem = redemption_rate * days_elapsed;
        // msg!("Amount in token to redeem {}", amount_to_redeem);
        let typed_amount = ((amount_to_redeem * 1e6) as u64) - stake.amount_redeemed;
        // msg!("typed_amount {}", typed_amount);
        stake.amount_redeemed += typed_amount;
        jollyranch.amount_redeemed += typed_amount;
        // new hotness is borken
        // token::transfer(ctx.accounts.transfer_ctx(), amount_to_redeem)?;
        // ol reliable?
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.sender_triton_account.to_account_info(),
                    to: ctx.accounts.reciever_triton_account.to_account_info(),
                    authority: ctx.accounts.sender_triton_account.to_account_info(),
                },
                &[&[
                    ctx.accounts.jollyranch.key().as_ref(),
                    &[ctx.accounts.jollyranch.spl_bump],
                ]],
            ),
            typed_amount,
        )?;
        stake.withdrawn = true;

        // transfer back nft
        anchor_spl::token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.sender_spl_account.to_account_info(),
                    to: ctx.accounts.reciever_spl_account.to_account_info(),
                    authority: ctx.accounts.sender_spl_account.to_account_info(),
                },
                &[&[
                    ctx.accounts.stake.key().as_ref(),
                    &[ctx.accounts.stake.spl_bump],
                ]],
            ),
            1,
        )?;
        // Finally, close the escrow account and refund the maker (they paid for
        // its rent-exemption).
        anchor_spl::token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            anchor_spl::token::CloseAccount {
                account: ctx.accounts.sender_spl_account.to_account_info(),
                destination: ctx.accounts.reciever_spl_account.to_account_info(),
                authority: ctx.accounts.sender_spl_account.to_account_info(),
            },
            &[&[
                ctx.accounts.stake.key().as_ref(),
                &[ctx.accounts.stake.spl_bump],
            ]],
        ))?;
        Ok(())
    }
}

// Data Validators

#[derive(Accounts)]
#[instruction(jolly_bump: u8, spl_bump: u8)]
pub struct Initialize<'info> {
    #[account(init, seeds = [b"jolly_account".as_ref()], bump = jolly_bump, payer = authority, space = JollyRanch::LEN)]
    pub jollyranch: Account<'info, JollyRanch>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, seeds = [jollyranch.key().as_ref()], bump = spl_bump, token::mint = mint, token::authority = reciever_spl_account, payer = authority)]
    pub reciever_spl_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct FundRanch<'info> {
    #[account(mut, has_one = authority, seeds = [b"jolly_account".as_ref()], bump = jollyranch.bump)]
    pub jollyranch: Account<'info, JollyRanch>,
    pub authority: Signer<'info>,
    // spl_token specific validations
    #[account(mut)]
    pub sender_spl_account: Account<'info, TokenAccount>,
    #[account(mut, seeds = [jollyranch.key().as_ref()], bump = jollyranch.spl_bump)]
    pub reciever_spl_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> FundRanch<'info> {
    pub fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.sender_spl_account.to_account_info(),
                to: self.reciever_spl_account.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
}

#[derive(Accounts)]
#[instruction(spl_bump: u8)]
pub struct StakeNFT<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init, payer = authority, space = Stake::LEN)]
    pub stake: Account<'info, Stake>,
    #[account(mut)]
    pub sender_spl_account: Account<'info, TokenAccount>,
    #[account(init, seeds = [stake.key().as_ref()], bump = spl_bump, token::mint = mint, token::authority = reciever_spl_account, payer = authority)]
    pub reciever_spl_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

impl<'info> StakeNFT<'info> {
    pub fn transfer_ctx(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.sender_spl_account.to_account_info(),
                to: self.reciever_spl_account.to_account_info(),
                authority: self.authority.to_account_info(),
            },
        )
    }
}

#[derive(Accounts)]
pub struct RedeemRewards<'info> {
    #[account(mut, has_one = authority)]
    pub stake: Account<'info, Stake>,
    #[account(mut)]
    pub jollyranch: Account<'info, JollyRanch>,
    pub authority: Signer<'info>,
    // spl_token specific validations
    #[account(mut, seeds = [jollyranch.key().as_ref()], bump = jollyranch.spl_bump)]
    pub sender_spl_account: Account<'info, TokenAccount>,
    #[account(init_if_needed, payer = authority, associated_token::mint = mint, associated_token::authority = authority)]
    pub reciever_spl_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct RedeemNFT<'info> {
    #[account(mut, has_one = authority)]
    pub stake: Box<Account<'info, Stake>>,
    #[account(mut)]
    pub jollyranch: Box<Account<'info, JollyRanch>>,
    pub authority: Signer<'info>,
    // spl_token specific validations
    #[account(mut, seeds = [stake.key().as_ref()], bump = stake.spl_bump)]
    pub sender_spl_account: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, payer = authority, associated_token::mint = nft, associated_token::authority = authority)]
    pub reciever_spl_account: Box<Account<'info, TokenAccount>>,
    // extra accounts for leftover funds
    #[account(mut, seeds = [jollyranch.key().as_ref()], bump = jollyranch.spl_bump)]
    pub sender_triton_account: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, payer = authority, associated_token::mint = mint, associated_token::authority = authority)]
    pub reciever_triton_account: Box<Account<'info, TokenAccount>>,
    pub mint: Box<Account<'info, Mint>>,
    pub nft: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// Data Structures

const DISCRIMINATOR_LENGTH: usize = 8;
const AUTHORITY_LENGTH: usize = 32;
const START_DATE_LENGTH: usize = 8;
const END_DATE_LENGTH: usize = 8;
const AMOUNT_LENGTH: usize = 8;
const AMOUNT_REDEEMED_LENGTH: usize = 8;
const AMOUNT_OWED_LENGTH: usize = 8;
const BUMP_LENGTH: usize = 8;
const WITHDRAWN_LENGTH: usize = 8;

#[account]
pub struct JollyRanch {
    pub authority: Pubkey,
    pub spl_bump: u8,
    pub amount: u64,
    pub amount_redeemed: u64,
    pub bump: u8,
}

impl JollyRanch {
    const LEN: usize = AMOUNT_LENGTH
        + AMOUNT_REDEEMED_LENGTH
        + DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + BUMP_LENGTH
        + BUMP_LENGTH;
}

#[account]
pub struct Stake {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub spl_bump: u8,
    pub start_date: i64,
    pub end_date: i64,
    pub amount_redeemed: u64,
    pub amount_owed: u64,
    pub withdrawn: bool,
}

impl Stake {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + AUTHORITY_LENGTH
        + BUMP_LENGTH
        + START_DATE_LENGTH
        + END_DATE_LENGTH
        + AMOUNT_REDEEMED_LENGTH
        + AMOUNT_OWED_LENGTH
        + WITHDRAWN_LENGTH;
}
// Error Codes
#[error]
pub enum ErrorCode {
    #[msg("The staking contract is out of funds.")]
    OutOfFunds,
}
