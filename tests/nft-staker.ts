import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { NftStaker } from "../target/types/nft_staker";
import * as assert from "assert";
import { PublicKey } from "@solana/web3.js";
import * as bs58 from "bs58";
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("nft-staker", async () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());
  // @ts-ignore
  const program = anchor.workspace.NftStaker as Program<NftStaker>;
  // default behavior new jollyranch each test

  // const jollyranch = anchor.web3.Keypair.generate();
  // switch to pda account for same jollyranch testing

  console.log("program", program.programId.toString());

  // pda generation example
  let [jollyranch, jollyBump] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("jolly_account")],
    program.programId
  );

  console.log("jollyranch", jollyranch.toBase58());
  console.log("jollyBump", jollyBump);

  // use your own token here ex TRTN
  const spl_token = new PublicKey(
    "8rDACnycUMGFvndX74ZM9sxjEbR3gUpVHDjDbL4qW6Zf"
  );

  const [recieverSplAccount, splBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [jollyranch.toBuffer()],
      program.programId
    );
  console.log("recieverSplAccount", recieverSplAccount.toBase58());
  console.log("splBump", splBump);

  console.log(
    "wallet pulbic key",
    program.provider.wallet.publicKey.toString()
  );

  let wallet_token_account = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    spl_token,
    program.provider.wallet.publicKey
  );
  console.log("wallet_token_account", wallet_token_account.toBase58());

  let jollyAccount;

  it("JollyRanch Created!", async () => {
    // only run this if it's the first time you're running the test
    await program.rpc.initialize(jollyBump, splBump, {
      accounts: {
        jollyranch: jollyranch,
        authority: program.provider.wallet.publicKey,
        recieverSplAccount: recieverSplAccount,
        mint: spl_token,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
    });
    jollyAccount = await program.account.jollyRanch.fetch(jollyranch);
    console.log("jollyAccount", jollyAccount);
    console.log("jollyAccount.amount", jollyAccount.amount.toString());
    console.log(
      "jollyAccount.amountRedeemed",
      jollyAccount.amountRedeemed.toString()
    );
    assert.equal(
      jollyAccount.authority.toBase58(),
      program.provider.wallet.publicKey.toBase58()
    );
    // assert.equal(jollyAccount.amount.toString(), new anchor.BN(0).toString());
    // assert.equal(
    //   jollyAccount.amountRedeemed.toString(),
    //   new anchor.BN(0).toString()
    // );
  });

  // fund the ranch
  // it("JollyRanch Funded", async () => {
  //   console.log(
  //     "sender token starting balance: ",
  //     await program.provider.connection.getTokenAccountBalance(
  //       wallet_token_account
  //     )
  //   );
  //   // console.log(
  //   //   "receiver token balance: ",
  //   //   await program.provider.connection.getTokenAccountBalance(
  //   //     recieverSplAccount
  //   //   )
  //   // );

  //   // let amount = new anchor.BN(1000000 * 1e6);
  //   // console.log("amount", amount.toString());
  //   // await program.rpc.fundRanch(amount, {
  //   //   accounts: {
  //   //     jollyranch: jollyranch,
  //   //     authority: program.provider.wallet.publicKey,
  //   //     senderSplAccount: wallet_token_account,
  //   //     recieverSplAccount: recieverSplAccount,
  //   //     tokenProgram: TOKEN_PROGRAM_ID,
  //   //     systemProgram: anchor.web3.SystemProgram.programId,
  //   //   },
  //   // });
  //   console.log(
  //     "sender token ending balance: ",
  //     await program.provider.connection.getTokenAccountBalance(
  //       wallet_token_account
  //     )
  //   );
  //   console.log(
  //     "receiver token balance: ",
  //     await program.provider.connection.getTokenAccountBalance(
  //       recieverSplAccount
  //     )
  //   );
  // });

  // it("Unix time tests", async () => {
  //   let amount = new anchor.BN(1e9);
  //   let stake = anchor.web3.Keypair.generate();
  //   await program.rpc.redeemRewards();
  // });

  // stake NFT
  // it("NFT Staked", async () => {
  // use your own NFT here ex Sea Shanty
  // const nft = new PublicKey("EZeQooiusTDvmGpHuMNkxEqxSouag6rvYgvth9wbnmZ");
  // const stake = anchor.web3.Keypair.generate();
  // let [stake_spl, stakeBump] = await anchor.web3.PublicKey.findProgramAddress(
  //   [stake.publicKey.toBuffer()],
  //   program.programId
  // );
  // let wallet_nft_account = await Token.getAssociatedTokenAddress(
  //   ASSOCIATED_TOKEN_PROGRAM_ID,
  //   TOKEN_PROGRAM_ID,
  //   nft,
  //   program.provider.wallet.publicKey
  // );
  // await program.rpc.stakeNft(stakeBump, {
  //   accounts: {
  //     authority: program.provider.wallet.publicKey,
  //     stake: stake.publicKey,
  //     senderSplAccount: wallet_nft_account,
  //     recieverSplAccount: stake_spl,
  //     mint: nft,
  //     systemProgram: anchor.web3.SystemProgram.programId,
  //     tokenProgram: TOKEN_PROGRAM_ID,
  //     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //   },
  //   signers: [stake],
  // });
  // console.log(
  //   "sender nft ending balance: ",
  //   await program.provider.connection.getTokenAccountBalance(
  //     wallet_nft_account
  //   )
  // );
  // second time just return all my stakes
  //   const stakedNfts = await program.account.stake.all([
  //     {
  //       memcmp: {
  //         offset: 8, // Discriminator
  //         bytes: bs58.encode(program.provider.wallet.publicKey.toBuffer()),
  //       },
  //     },
  //   ]);
  //   console.log("stakedNfts", stakedNfts);
  //   stakedNfts.map((stake, index) => {
  //     console.log("stake:", index);
  //     console.log(
  //       "stake.account.startDate",
  //       new Date(stake.account.startDate.toNumber() * 1000)
  //     );
  //     console.log(
  //       "stake.account.endDate",
  //       new Date(stake.account.endDate.toNumber() * 1000)
  //     );
  //     console.log(
  //       "stake.account.amountRedeemed",
  //       stake.account.amountRedeemed.toString()
  //     );
  //     console.log(
  //       "stake.account.amountOwed",
  //       stake.account.amountOwed.toString()
  //     );
  //   });
  // });

  // it("Redeem rewards", async () => {
  //   // use your own token here ex TRTN
  //   const spl_token = new PublicKey(
  //     "8rDACnycUMGFvndX74ZM9sxjEbR3gUpVHDjDbL4qW6Zf"
  //   );
  //   console.log("wallet_token_account", wallet_token_account.toString());
  //   // console.log(
  //   //   "program token starting balance: ",
  //   //   await program.provider.connection.getTokenAccountBalance(
  //   //     wallet_token_account
  //   //   )
  //   // );
  //   let redeemableNfts = [];
  //   const stakedNfts = await program.account.stake.all([
  //     {
  //       memcmp: {
  //         offset: 8, // Discriminator
  //         // bytes: bs58.encode(wallet.publicKey.toBuffer()),
  //         bytes: program.provider.wallet.publicKey.toBase58(),
  //       },
  //     },
  //   ]);
  //   // console.log("stakedNfts", stakedNfts);
  //   stakedNfts.map((stake, index) => {
  //     // console.log(
  //     //   "stakes:",
  //     //   index,
  //     //   stake.account.withdrawn,
  //     //   stake.account.mint.toString()
  //     // );
  //     if (stake.account.withdrawn === false) {
  //       redeemableNfts.push(stake);
  //     }
  //   });
  //   redeemableNfts.map((stake, index) => {
  //     console.log(
  //       "redeemable:",
  //       index,
  //       stake.account.withdrawn,
  //       stake.account.mint.toString()
  //     );
  //   });
  //   console.log(
  //     "redeemableNfts[0].account.mint.toString()",
  //     redeemableNfts[0].account.mint.toString()
  //   );

  //   // console.log("stakedNfts", stakedNfts);

  //   let currDate = new Date().getTime() / 1000;
  //   let redemption_rate = 6.9;
  //   let daysElapsed =
  //     Math.abs(currDate - redeemableNfts[0].account.startDate) / (60 * 60 * 24);
  //   let estimateRewards = redemption_rate * daysElapsed;

  //   console.log("estimateRewards", estimateRewards);

  //   await program.rpc.redeemRewards({
  //     accounts: {
  //       stake: redeemableNfts[0].publicKey,
  //       jollyranch: jollyranch,
  //       authority: program.provider.wallet.publicKey,
  //       senderSplAccount: recieverSplAccount,
  //       recieverSplAccount: wallet_token_account,
  //       mint: spl_token,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //     },
  //   });
  //   // console.log(
  //   //   "sender token ending balance: ",
  //   //   await program.provider.connection.getTokenAccountBalance(
  //   //     wallet_token_account
  //   //   )
  //   // );
  // });

  // it("Redeem nft back", async () => {
  //   // get staked nfts
  //   let redeemableNfts = [];
  //   const stakedNfts = await program.account.stake.all([
  //     {
  //       memcmp: {
  //         offset: 8, // Discriminator
  //         // bytes: bs58.encode(wallet.publicKey.toBuffer()),
  //         bytes: program.provider.wallet.publicKey.toBase58(),
  //       },
  //     },
  //   ]);
  //   // console.log("stakedNfts", stakedNfts);
  //   stakedNfts.map((stake, index) => {
  //     // console.log(
  //     //   "stakes:",
  //     //   index,
  //     //   stake.account.withdrawn,
  //     //   stake.account.mint.toString()
  //     // );
  //     if (stake.account.withdrawn === false) {
  //       redeemableNfts.push(stake);
  //     }
  //   });
  //   // redeemableNfts.map((stake, index) => {
  //   //   console.log(
  //   //     "redeemable:",
  //   //     index,
  //   //     stake.account.withdrawn,
  //   //     stake.account.mint.toString()
  //   //   );
  //   // });
  //   // console.log("stakesPubKey", redeemableNfts[0].publicKey.toString());
  //   // console.log("nftPubKey", redeemableNfts[0].account.mint.toString());

  //   const nft = new PublicKey(redeemableNfts[0].account.mint.toString());
  //   let wallet_nft_account = await Token.getAssociatedTokenAddress(
  //     ASSOCIATED_TOKEN_PROGRAM_ID,
  //     TOKEN_PROGRAM_ID,
  //     nft,
  //     program.provider.wallet.publicKey
  //   );
  //   // console.log("wallet_nft_account", wallet_nft_account.toString());
  //   // console.log(
  //   //   "sender nft starting balance: ",
  //   //   await program.provider.connection.getTokenAccountBalance(
  //   //     wallet_nft_account
  //   //   )
  //   // );

  //   // console.log("stakedNfts", stakedNfts);

  //   let [stake_spl, _stakeBump] =
  //     await anchor.web3.PublicKey.findProgramAddress(
  //       [redeemableNfts[0].publicKey.toBuffer()],
  //       program.programId
  //     );

  //   console.log("stake_spl", stake_spl.toString());

  //   await program.rpc.redeemNft({
  //     accounts: {
  //       stake: redeemableNfts[0].publicKey,
  //       jollyranch: jollyranch,
  //       authority: program.provider.wallet.publicKey,
  //       senderSplAccount: stake_spl,
  //       recieverSplAccount: wallet_nft_account,
  //       senderTritonAccount: recieverSplAccount,
  //       recieverTritonAccount: wallet_token_account,
  //       mint: spl_token,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
  //       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //     },
  //   });
  // console.log(
  //   "sender nft ending balance: ",
  //   await program.provider.connection.getTokenAccountBalance(
  //     wallet_nft_account
  //   )
  // );
  // });
});
