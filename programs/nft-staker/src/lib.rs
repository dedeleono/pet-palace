use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};
use arrayref::array_ref;

declare_id!("Gfpip7T6hdF2BZZNXA5xQNrwGLPd9KCa2GgnJRZB1woE");

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

    pub fn oracle(ctx: Context<Oracle>, seed: u32) -> ProgramResult {
        let signer = &ctx.accounts.authority.key();
        if signer.to_string() != "SEA1xkZzPCUJBb5mcNb6ts9VExNr2kYMit3T5poqr94" {
            return Err(ErrorCode::OnlyOracleCanUpdate.into());
        }
        let breed = &mut ctx.accounts.breed;
        if breed.oracle {
            return Err(ErrorCode::OracleHasAlreadySpoken.into());
        }
        breed.seed = seed as u64;

        let result = ((breed.id + (breed.timestamp as u64) + breed.seed) % 100) + 1;
        breed.result = result as u8;
        breed.oracle = true;

        Ok(())
    }

    pub fn fund_pet(ctx: Context<FundPet>, pet_bump: u8) -> ProgramResult {
        let pet = &mut ctx.accounts.pet;
        pet.bump = pet_bump;
        pet.mint = ctx.accounts.mint.key();
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::Transfer {
                    from: ctx.accounts.sender_spl_account.to_account_info(),
                    to: ctx.accounts.reciever_spl_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            1,
        )?;

        Ok(())
    }

    pub fn redeem_pet(ctx: Context<RedeemPet>) -> ProgramResult {
        let pet = &mut ctx.accounts.pet;
        let breed = &mut ctx.accounts.breed;
        if pet.withdrawn == true {
            return Err(ErrorCode::PetAlreadyRedeemed.into());
        }
        if breed.withdrawn == true {
            return Err(ErrorCode::BreedAlreadyWithdrawn.into());
        }
        if breed.oracle == false {
            return Err(ErrorCode::OracleHasNotSpoken.into());
        }
        if breed.chance >= breed.result {
            msg!("Congratulations! YOU WON A PET");
            // transfer back nft
            // anchor_spl::token::transfer(
            //     CpiContext::new_with_signer(
            //         ctx.accounts.token_program.to_account_info(),
            //         anchor_spl::token::Transfer {
            //             from: ctx.accounts.sender_nft_account.to_account_info(),
            //             to: ctx.accounts.reciever_nft_account.to_account_info(),
            //             authority: ctx.accounts.sender_nft_account.to_account_info(),
            //         },
            //         &[&[pet.key().as_ref(), &[pet.bump]]],
            //     ),
            //     1,
            // )?;
            // Finally, close the escrow account and refund the maker (they paid for
            // its rent-exemption).
            // anchor_spl::token::close_account(CpiContext::new_with_signer(
            //     ctx.accounts.token_program.to_account_info(),
            //     anchor_spl::token::CloseAccount {
            //         account: ctx.accounts.sender_nft_account.to_account_info(),
            //         destination: ctx.accounts.reciever_nft_account.to_account_info(),
            //         authority: ctx.accounts.sender_nft_account.to_account_info(),
            //     },
            //     &[&[pet.key().as_ref(), &[pet.bump]]],
            // ))?;
        } else {
            msg!("Sorry! You were unable to breed/train a pet. TRY AGAIN");
        }
        // pet.withdrawn = true;
        breed.withdrawn = true;
        Ok(())
    }

    pub fn breed_pet(ctx: Context<BreedPet>, trtn: u64) -> ProgramResult {
        let mut total = trtn as i64;
        if total < 120 {
            return Err(ErrorCode::NotEnoughTriton.into());
        }
        if total > 1642 {
            return Err(ErrorCode::TooMuchTriton.into());
        }
        let breed = &mut ctx.accounts.breed;
        let signer = &ctx.accounts.authority;
        let recent_slothashes = &ctx.accounts.slot_hashes;
        if recent_slothashes.key().to_string() != "SysvarS1otHashes111111111111111111111111111" {
            return Err(ErrorCode::IncorrectSlotHashesPubkey.into());
        }
        let clock = Clock::get().unwrap();
        let slots = recent_slothashes.data.borrow();
        let key_bytes = signer.key().to_bytes();
        let mut combo = vec![0u8; 32];
        for i in 0..key_bytes.len() {
            combo[i] = key_bytes[i] + slots[i];
        }
        let parsed = array_ref![combo, 4, 8];
        let id = u64::from_le_bytes(*parsed);
        msg!("id: {}", id);
        msg!("UnixTimestamp: {}", clock.unix_timestamp);
        breed.authority = signer.key();
        breed.id = id;
        breed.timestamp = clock.unix_timestamp;
        breed.withdrawn = false;
        breed.chance += 10;
        total -= 120;
        if total - 1000 >= 0 {
            breed.items.kings_crown = true;
            total = total - 1000;
            breed.chance += 50;
        }
        if total - 270 >= 0 {
            breed.items.jewlrey = true;
            total = total - 270;
            breed.chance += 20;
        }
        if total - 210 >= 0 {
            breed.items.jewlrey = true;
            total = total - 210;
            breed.chance += 15;
        }
        if total - 42 >= 0 {
            breed.items.jewlrey = true;
            total = total - 42;
            breed.chance += 3;
        }
        if total != 0 {
            return Err(ErrorCode::FailedToParseItems.into());
        }
        msg!("Breed Chance: {}", breed.chance);
        let trtn_parsed = ((trtn as f64) * 1e6) as u64;
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.auth_trtn_account.to_account_info(),
                    to: ctx.accounts.trtn_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            trtn_parsed,
        )?;
        Ok(())
    }
    pub fn train_pet(ctx: Context<TrainPet>, trtn: u64) -> ProgramResult {
        let mut total = trtn as i64;
        if total < 150 {
            return Err(ErrorCode::NotEnoughTriton.into());
        }
        if total > 1675 {
            return Err(ErrorCode::TooMuchTriton.into());
        }
        let breed = &mut ctx.accounts.breed;
        let signer = &ctx.accounts.authority;
        let recent_slothashes = &ctx.accounts.slot_hashes;
        if recent_slothashes.key().to_string() != "SysvarS1otHashes111111111111111111111111111" {
            return Err(ErrorCode::IncorrectSlotHashesPubkey.into());
        }
        let clock = Clock::get().unwrap();
        let slots = recent_slothashes.data.borrow();
        let key_bytes = signer.key().to_bytes();
        let mut combo = vec![0u8; 32];
        for i in 0..key_bytes.len() {
            combo[i] = key_bytes[i] + slots[i];
        }
        let parsed = array_ref![combo, 4, 8];
        let id = u64::from_le_bytes(*parsed);
        msg!("id: {}", id);
        msg!("UnixTimestamp: {}", clock.unix_timestamp);
        breed.authority = signer.key();
        breed.id = id;
        breed.timestamp = clock.unix_timestamp;
        breed.withdrawn = false;
        total -= 150;
        breed.chance += 10;
        if total - 1000 >= 0 {
            breed.items.poseidon_whistle = true;
            total = total - 1000;
            breed.chance += 50;
        }
        if total - 300 >= 0 {
            breed.items.hook = true;
            total = total - 300;
            breed.chance += 20;
        }
        if total - 225 >= 0 {
            breed.items.bait = true;
            total = total - 225;
            breed.chance += 15;
        }
        if total != 0 {
            return Err(ErrorCode::FailedToParseItems.into());
        }
        msg!("Breed Chance: {}", breed.chance);
        let trtn_parsed = ((trtn as f64) * 1e6) as u64;
        anchor_spl::token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.auth_trtn_account.to_account_info(),
                    to: ctx.accounts.trtn_account.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            trtn_parsed,
        )?;
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

    pub fn stake_nft(ctx: Context<StakeNFT>, spl_bumps: [u8; 4]) -> ProgramResult {
        let clock = Clock::get().unwrap();
        let stake = &mut ctx.accounts.stake;
        stake.authority = ctx.accounts.authority.key();
        stake.mints = [
            ctx.accounts.mint_0.key(),
            ctx.accounts.mint_1.key(),
            ctx.accounts.mint_2.key(),
            ctx.accounts.mint_3.key(),
        ];
        stake.start_date = clock.unix_timestamp;
        stake.spl_bumps = spl_bumps;
        stake.amount_owed = 0;
        stake.amount_redeemed = 0;
        let mut amount_staked = 0;
        for (i, mint) in stake.mints.iter().enumerate() {
            if mint.to_string() != "0" {
                if i == 0 {
                    anchor_spl::token::transfer(
                        CpiContext::new(
                            ctx.accounts.token_program.to_account_info(),
                            anchor_spl::token::Transfer {
                                from: ctx.accounts.mint_0.to_account_info(),
                                to: ctx.accounts.reciever_spl_account_0.to_account_info(),
                                authority: ctx.accounts.authority.to_account_info(),
                            },
                        ),
                        1,
                    )?;
                    amount_staked = amount_staked + 1;
                } else if i == 1 {
                    anchor_spl::token::transfer(
                        CpiContext::new(
                            ctx.accounts.token_program.to_account_info(),
                            anchor_spl::token::Transfer {
                                from: ctx.accounts.mint_1.to_account_info(),
                                to: ctx.accounts.reciever_spl_account_1.to_account_info(),
                                authority: ctx.accounts.authority.to_account_info(),
                            },
                        ),
                        1,
                    )?;
                    amount_staked = amount_staked + 1;
                } else if i == 2 {
                    anchor_spl::token::transfer(
                        CpiContext::new(
                            ctx.accounts.token_program.to_account_info(),
                            anchor_spl::token::Transfer {
                                from: ctx.accounts.mint_2.to_account_info(),
                                to: ctx.accounts.reciever_spl_account_2.to_account_info(),
                                authority: ctx.accounts.authority.to_account_info(),
                            },
                        ),
                        1,
                    )?;
                    amount_staked = amount_staked + 1;
                } else if i == 3 {
                    anchor_spl::token::transfer(
                        CpiContext::new(
                            ctx.accounts.token_program.to_account_info(),
                            anchor_spl::token::Transfer {
                                from: ctx.accounts.mint_3.to_account_info(),
                                to: ctx.accounts.reciever_spl_account_3.to_account_info(),
                                authority: ctx.accounts.authority.to_account_info(),
                            },
                        ),
                        1,
                    )?;
                    amount_staked = amount_staked + 1;
                }
            }
        }

        stake.stake_amount = amount_staked;

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
        let mut redemption_rate = 1.0;
        if stake.stake_amount == 2 {
            redemption_rate = 4.0;
        } else if stake.stake_amount == 3 {
            redemption_rate = 18.0;
        } else if stake.stake_amount == 4 {
            redemption_rate = 32.0;
        }

        let mint_0 = stake.mints[0].to_string();
        let mint_1 = stake.mints[1].to_string();
        let mint_2 = stake.mints[2].to_string();
        let mint_3 = stake.mints[3].to_string();
        let mint_list: Vec<_> = vec![
            "8jDN1VYpCtk6gYxuRrEww8vnjbaKiaZexy145CVNyEoM",
            "57LZHdfcb4G5unkLaJKWqSUy4mpWAoCtCXj4hB6cZHgF",
            "54KFLjw4ywGWzNeh6o8LrHEP8mTjiBRX4DrNjWGiMUhT",
            "GvQF2vpWKWhv2LEyEurP5koNRFrA6s7Hx66zsv536KeC",
        ]
        .into_iter()
        .map(String::from)
        .collect();
        if mint_list.contains(&mint_0) {
            redemption_rate = 20.0 * (stake.stake_amount as f64);
        }
        if mint_list.contains(&mint_1) {
            redemption_rate = 20.0 * (stake.stake_amount as f64);
        }
        if mint_list.contains(&mint_2) {
            redemption_rate = 20.0 * (stake.stake_amount as f64);
        }
        if mint_list.contains(&mint_3) {
            redemption_rate = 20.0 * (stake.stake_amount as f64);
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
        let mut redemption_rate = 1.0;
        if stake.stake_amount == 2 {
            redemption_rate = 4.0;
        } else if stake.stake_amount == 3 {
            redemption_rate = 18.0;
        } else if stake.stake_amount == 4 {
            redemption_rate = 32.0;
        }

        let mint_0 = stake.mints[0].to_string();
        let mint_1 = stake.mints[1].to_string();
        let mint_2 = stake.mints[2].to_string();
        let mint_3 = stake.mints[3].to_string();
        let mint_list: Vec<_> = vec![
            "8jDN1VYpCtk6gYxuRrEww8vnjbaKiaZexy145CVNyEoM",
            "57LZHdfcb4G5unkLaJKWqSUy4mpWAoCtCXj4hB6cZHgF",
            "54KFLjw4ywGWzNeh6o8LrHEP8mTjiBRX4DrNjWGiMUhT",
            "GvQF2vpWKWhv2LEyEurP5koNRFrA6s7Hx66zsv536KeC",
        ]
        .into_iter()
        .map(String::from)
        .collect();
        if mint_list.contains(&mint_0) {
            redemption_rate = 20.0 * (stake.stake_amount as f64);
        }
        if mint_list.contains(&mint_1) {
            redemption_rate = 20.0 * (stake.stake_amount as f64);
        }
        if mint_list.contains(&mint_2) {
            redemption_rate = 20.0 * (stake.stake_amount as f64);
        }
        if mint_list.contains(&mint_3) {
            redemption_rate = 20.0 * (stake.stake_amount as f64);
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

        for (i, mint) in stake.mints.iter().enumerate() {
            if mint.to_string() != "0" {
                if i == 0 {
                    anchor_spl::token::transfer(
                        CpiContext::new_with_signer(
                            ctx.accounts.token_program.to_account_info(),
                            anchor_spl::token::Transfer {
                                from: ctx.accounts.sender_nft_account_0.to_account_info(),
                                to: ctx.accounts.reciever_nft_account_0.to_account_info(),
                                authority: ctx.accounts.sender_nft_account_0.to_account_info(),
                            },
                            &[&[stake.key().as_ref(), &[stake.spl_bumps[i]]]],
                        ),
                        1,
                    )?;
                    anchor_spl::token::close_account(CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        anchor_spl::token::CloseAccount {
                            account: ctx.accounts.sender_nft_account_0.to_account_info(),
                            destination: ctx.accounts.reciever_nft_account_0.to_account_info(),
                            authority: ctx.accounts.sender_nft_account_0.to_account_info(),
                        },
                        &[&[stake.key().as_ref(), &[stake.spl_bumps[i]]]],
                    ))?;
                } else if i == 1 {
                    anchor_spl::token::transfer(
                        CpiContext::new_with_signer(
                            ctx.accounts.token_program.to_account_info(),
                            anchor_spl::token::Transfer {
                                from: ctx.accounts.sender_nft_account_1.to_account_info(),
                                to: ctx.accounts.reciever_nft_account_1.to_account_info(),
                                authority: ctx.accounts.sender_nft_account_1.to_account_info(),
                            },
                            &[&[stake.key().as_ref(), &[stake.spl_bumps[i]]]],
                        ),
                        1,
                    )?;
                    anchor_spl::token::close_account(CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        anchor_spl::token::CloseAccount {
                            account: ctx.accounts.sender_nft_account_1.to_account_info(),
                            destination: ctx.accounts.reciever_nft_account_1.to_account_info(),
                            authority: ctx.accounts.sender_nft_account_1.to_account_info(),
                        },
                        &[&[stake.key().as_ref(), &[stake.spl_bumps[i]]]],
                    ))?;
                } else if i == 2 {
                    anchor_spl::token::transfer(
                        CpiContext::new_with_signer(
                            ctx.accounts.token_program.to_account_info(),
                            anchor_spl::token::Transfer {
                                from: ctx.accounts.sender_nft_account_2.to_account_info(),
                                to: ctx.accounts.reciever_nft_account_2.to_account_info(),
                                authority: ctx.accounts.sender_nft_account_2.to_account_info(),
                            },
                            &[&[stake.key().as_ref(), &[stake.spl_bumps[i]]]],
                        ),
                        1,
                    )?;
                    anchor_spl::token::close_account(CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        anchor_spl::token::CloseAccount {
                            account: ctx.accounts.sender_nft_account_2.to_account_info(),
                            destination: ctx.accounts.reciever_nft_account_2.to_account_info(),
                            authority: ctx.accounts.sender_nft_account_2.to_account_info(),
                        },
                        &[&[stake.key().as_ref(), &[stake.spl_bumps[i]]]],
                    ))?;
                } else if i == 3 {
                    anchor_spl::token::transfer(
                        CpiContext::new_with_signer(
                            ctx.accounts.token_program.to_account_info(),
                            anchor_spl::token::Transfer {
                                from: ctx.accounts.sender_nft_account_3.to_account_info(),
                                to: ctx.accounts.reciever_nft_account_3.to_account_info(),
                                authority: ctx.accounts.sender_nft_account_3.to_account_info(),
                            },
                            &[&[stake.key().as_ref(), &[stake.spl_bumps[i]]]],
                        ),
                        1,
                    )?;
                    anchor_spl::token::close_account(CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        anchor_spl::token::CloseAccount {
                            account: ctx.accounts.sender_nft_account_3.to_account_info(),
                            destination: ctx.accounts.reciever_nft_account_3.to_account_info(),
                            authority: ctx.accounts.sender_nft_account_3.to_account_info(),
                        },
                        &[&[stake.key().as_ref(), &[stake.spl_bumps[i]]]],
                    ))?;
                }
            }
        }

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
pub struct Oracle<'info> {
    pub authority: Signer<'info>,
    #[account(mut)]
    pub breed: Account<'info, Breed>,
}
#[derive(Accounts)]
pub struct RedeemPet<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority)]
    pub breed: Box<Account<'info, Breed>>,
    #[account(mut)]
    pub pet: Box<Account<'info, Pet>>,
    #[account(mut, seeds = [pet.key().as_ref()], bump = pet.bump)]
    pub sender_nft_account: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, payer = authority, associated_token::mint = nft, associated_token::authority = authority)]
    pub reciever_nft_account: Box<Account<'info, TokenAccount>>,
    pub nft: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct BreedPet<'info> {
    pub authority: Signer<'info>,
    #[account(init, payer = authority)]
    pub breed: Account<'info, Breed>,
    #[account(has_one = authority)]
    pub stake: Account<'info, Stake>,
    pub jollyranch: Account<'info, JollyRanch>,
    #[account(mut, seeds = [jollyranch.key().as_ref()], bump = jollyranch.spl_bump)]
    pub trtn_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub auth_trtn_account: Account<'info, TokenAccount>,
    pub slot_hashes: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TrainPet<'info> {
    pub authority: Signer<'info>,
    #[account(init, payer = authority)]
    pub breed: Account<'info, Breed>,
    pub jollyranch: Account<'info, JollyRanch>,
    #[account(mut, seeds = [jollyranch.key().as_ref()], bump = jollyranch.spl_bump)]
    pub trtn_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub auth_trtn_account: Account<'info, TokenAccount>,
    pub slot_hashes: UncheckedAccount<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundRanch<'info> {
    #[account(mut, seeds = [b"jolly_account".as_ref()], bump = jollyranch.bump)]
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
#[instruction(pet_bump: u8)]
pub struct FundPet<'info> {
    pub authority: Signer<'info>,
    #[account(init_if_needed, payer = authority)]
    pub pet: Account<'info, Pet>,
    #[account(mut)]
    pub sender_spl_account: Account<'info, TokenAccount>,
    #[account(init_if_needed, seeds = [pet.key().as_ref()], bump = pet_bump, token::mint = mint, token::authority = reciever_spl_account, payer = authority)]
    pub reciever_spl_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(spl_bumps: [u8;4])]
pub struct StakeNFT<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(init_if_needed, payer = authority, space = Stake::LEN)]
    pub stake: Box<Account<'info, Stake>>,
    #[account(mut)]
    pub sender_spl_account_0: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub sender_spl_account_1: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub sender_spl_account_2: Box<Account<'info, TokenAccount>>,
    #[account(mut)]
    pub sender_spl_account_3: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, seeds = [stake.key().as_ref()], bump = spl_bumps[0], token::mint = mint_0, token::authority = reciever_spl_account_0, payer = authority)]
    pub reciever_spl_account_0: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, seeds = [stake.key().as_ref()], bump = spl_bumps[0], token::mint = mint_1, token::authority = reciever_spl_account_1, payer = authority)]
    pub reciever_spl_account_1: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, seeds = [stake.key().as_ref()], bump = spl_bumps[0], token::mint = mint_2, token::authority = reciever_spl_account_2, payer = authority)]
    pub reciever_spl_account_2: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, seeds = [stake.key().as_ref()], bump = spl_bumps[0], token::mint = mint_3, token::authority = reciever_spl_account_3, payer = authority)]
    pub reciever_spl_account_3: Box<Account<'info, TokenAccount>>,
    pub mint_0: Box<Account<'info, Mint>>,
    pub mint_1: Box<Account<'info, Mint>>,
    pub mint_2: Box<Account<'info, Mint>>,
    pub mint_3: Box<Account<'info, Mint>>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub rent: Sysvar<'info, Rent>,
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
    #[account(mut, seeds = [stake.key().as_ref()], bump = stake.spl_bumps[0])]
    pub sender_nft_account_0: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, payer = authority, associated_token::mint = nft_0, associated_token::authority = authority)]
    pub reciever_nft_account_0: Box<Account<'info, TokenAccount>>,
    #[account(mut, seeds = [stake.key().as_ref()], bump = stake.spl_bumps[1])]
    pub sender_nft_account_1: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, payer = authority, associated_token::mint = nft_1, associated_token::authority = authority)]
    pub reciever_nft_account_1: Box<Account<'info, TokenAccount>>,
    #[account(mut, seeds = [stake.key().as_ref()], bump = stake.spl_bumps[2])]
    pub sender_nft_account_2: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, payer = authority, associated_token::mint = nft_2, associated_token::authority = authority)]
    pub reciever_nft_account_2: Box<Account<'info, TokenAccount>>,
    #[account(mut, seeds = [stake.key().as_ref()], bump = stake.spl_bumps[3])]
    pub sender_nft_account_3: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, payer = authority, associated_token::mint = nft_3, associated_token::authority = authority)]
    pub reciever_nft_account_3: Box<Account<'info, TokenAccount>>,
    // extra accounts for leftover funds
    #[account(mut, seeds = [jollyranch.key().as_ref()], bump = jollyranch.spl_bump)]
    pub sender_triton_account: Box<Account<'info, TokenAccount>>,
    #[account(init_if_needed, payer = authority, associated_token::mint = mint, associated_token::authority = authority)]
    pub reciever_triton_account: Box<Account<'info, TokenAccount>>,
    pub mint: Box<Account<'info, Mint>>,
    pub nft_0: Box<Account<'info, Mint>>,
    pub nft_1: Box<Account<'info, Mint>>,
    pub nft_2: Box<Account<'info, Mint>>,
    pub nft_3: Box<Account<'info, Mint>>,
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
#[derive(Default)]
pub struct Stake {
    pub authority: Pubkey,
    pub mints: [Pubkey; 4],
    pub spl_bumps: [u8; 4],
    pub stake_amount: u8,
    pub start_date: i64,
    pub end_date: i64,
    pub amount_redeemed: u64,
    pub amount_owed: u64,
    pub withdrawn: bool,
}

impl Stake {
    const LEN: usize = DISCRIMINATOR_LENGTH
        + AUTHORITY_LENGTH
        + (AUTHORITY_LENGTH * 4)
        + (BUMP_LENGTH * 4)
        + BUMP_LENGTH
        + START_DATE_LENGTH
        + END_DATE_LENGTH
        + AMOUNT_REDEEMED_LENGTH
        + AMOUNT_OWED_LENGTH
        + WITHDRAWN_LENGTH;
}

#[account]
#[derive(Default)]
pub struct Pet {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub bump: u8,
    pub withdrawn: bool,
}

#[account]
#[derive(Default)]
pub struct Breed {
    pub authority: Pubkey,
    pub id: u64,
    pub timestamp: i64,
    pub seed: u64,
    pub chance: u8,
    pub result: u8,
    pub withdrawn: bool,
    pub oracle: bool,
    pub items: Items,
}

#[derive(Default, AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub struct Items {
    pub fresh_haircut: bool,
    pub bow_tie: bool,
    pub jewlrey: bool,
    pub kings_crown: bool,
    pub bait: bool,
    pub hook: bool,
    pub poseidon_whistle: bool,
}

// Error Codes
#[error]
pub enum ErrorCode {
    #[msg("the staking contract is out of funds")]
    OutOfFunds,
    #[msg("ah ah ah, no passing in fake sysvar accounts")]
    IncorrectSlotHashesPubkey,
    #[msg("not enough triton was sent")]
    NotEnoughTriton,
    #[msg("too much triton was sent")]
    TooMuchTriton,
    #[msg("couldn't parse breed items")]
    FailedToParseItems,
    #[msg("pet already redeemed")]
    PetAlreadyRedeemed,
    #[msg("breed or train attempt already over")]
    BreedAlreadyWithdrawn,
    #[msg("the oracle already rolled")]
    OracleHasAlreadySpoken,
    #[msg("the oracle still needs to seed your roll")]
    OracleHasNotSpoken,
    #[msg("only the oracle can provide seeds")]
    OnlyOracleCanUpdate,
}
