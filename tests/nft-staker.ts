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

export interface RandoPDA {
  nonce: number;
  numericResult: number;
  requestReference: PublicKey;
  oracleResults: Array<number>;
  result: Array<number>;
}

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
  // devnet trition: 7RDibaGCRPSNBecU34AQPDioVYtgz1adYzPVaF4uryd9
  // const spl_token = new PublicKey(
  //   "7RDibaGCRPSNBecU34AQPDioVYtgz1adYzPVaF4uryd9"
  // );
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
    // await program.rpc.initialize(jollyBump, splBump, {
    //   accounts: {
    //     jollyranch: jollyranch,
    //     authority: program.provider.wallet.publicKey,
    //     recieverSplAccount: recieverSplAccount,
    //     mint: spl_token,
    //     systemProgram: anchor.web3.SystemProgram.programId,
    //     tokenProgram: TOKEN_PROGRAM_ID,
    //     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
    //   },
    // });
    jollyAccount = await program.account.jollyRanch.fetch(jollyranch);
    console.log("jollyAccount", jollyAccount);
    console.log("jollyAccount.amount", jollyAccount.amount.toString());
    console.log(
      "jollyAccount.amountRedeemed",
      jollyAccount.amountRedeemed.toString()
    );
    // assert.equal(
    //   jollyAccount.authority.toBase58(),
    //   program.provider.wallet.publicKey.toBase58()
    // );
    // assert.equal(jollyAccount.amount.toString(), new anchor.BN(0).toString());
    // assert.equal(
    //   jollyAccount.amountRedeemed.toString(),
    //   new anchor.BN(0).toString()
    // );
  });

  // it("Oracle Booted Up", async () => {
  //   const a = anchor.Provider.env().connection.onProgramAccountChange(
  //     program.programId,
  //     async (programAccount) => {
  //       // console.log("programAccount", programAccount);
  //       // console.log(
  //       //   "programAccount accountId",
  //       //   programAccount.accountId.toString()
  //       // );
  //       let breed = await program.account.breed.fetch(programAccount.accountId);
  //       // console.log("breed", breed);
  //       // console.log("breed", breed.oracle);
  //       if (!breed.oracle) {
  //         console.log("parsing breed:", breed.id.toString());
  //         let seed = Math.floor(Math.random() * (4294967295 - 0 + 1)) + 0;
  //         await program.rpc.oracle(seed, {
  //           accounts: {
  //             authority: program.provider.wallet.publicKey,
  //             breed: breed[0].publicKey,
  //           },
  //         });
  //       }
  //     }
  //   );
  // });

  // function to run if the server has errors
  // it("Oracle Missed Accounts", async () => {
  //   const missedBreeds = await program.account.breed.all([
  //     {
  //       memcmp: {
  //         offset: 8 + 32 + 8 + 8 + 8 + 1 + 1,
  //         // bytes: bs58.encode(wallet.publicKey.toBuffer()),
  //         bytes: bs58.encode(new Uint8Array([0])),
  //       },
  //     },
  //   ]);
  //   console.log("missedBreeds", missedBreeds);
  //   for (let i = 0; i < missedBreeds.length; i++) {
  //     const breed = missedBreeds[i];
  //     if (!breed.account.oracle) {
  //       console.log("parsing missedbreed:", breed.account.id.toString());
  //       let seed = Math.floor(Math.random() * (4294967295 - 0 + 1)) + 0;
  //       await program.rpc.oracle(seed, {
  //         accounts: {
  //           authority: program.provider.wallet.publicKey,
  //           breed: breed.publicKey,
  //         },
  //       });
  //     }
  //   }
  // });

  // test randomness

  // it("Fetch Random Number", async () => {
  //   let accountId = "9iT8NfV1H61kh9F4NxopbtYVGd82XKyZsGZgXNBbsEoC";
  //   const randoProgram = await anchor.Program.at(
  //     "CFVk3Q9pN3W7qJaZbkmR5Jeb6TXsh51oSLvgEn3Szjd9",
  //     anchor.Provider.env()
  //   );
  //   let randoResult = (await randoProgram.account.randoResult.fetch(
  //     accountId
  //   )) as RandoPDA;
  //   console.log("randoResult", randoResult);
  // });

  // it("Generating Random Number", async () => {
  //   // const ref = new anchor.web3.Keypair();
  //   const ref = new anchor.web3.Keypair();
  //   const randoProgram = await anchor.Program.at(
  //     "CFVk3Q9pN3W7qJaZbkmR5Jeb6TXsh51oSLvgEn3Szjd9",
  //     anchor.Provider.env()
  //   );
  //   // console.log(ref.publicKey.toString(), vaultSigner.toString());
  //   const a = anchor.Provider.env().connection.onProgramAccountChange(
  //     randoProgram.programId,
  //     async (p) => {
  //       console.log("");
  //       console.log("p accountId", p.accountId.toString());
  //       let randoResult = (await randoProgram.account.randoResult.fetch(
  //         p.accountId
  //       )) as RandoPDA;
  //       // console.log("randoResult", randoResult);
  //       // if (
  //       //   randoResult.requestReference.toString() === ref.publicKey.toString()
  //       // ) {
  //       //   console.log("resltJson:", randoResult);
  //       // } else {
  //       // console.log("resltJson:", JSON.stringify(randoResult));
  //       console.log("nonce", randoResult.nonce.toString());
  //       console.log(
  //         "requestReference",
  //         randoResult.requestReference.toString()
  //       );

  //       // console.log(
  //       //   "Seed:",
  //       //   JSON.stringify(
  //       //     Array.from(
  //       //       Uint8Array.from(randoResult?.requestReference.toBuffer())
  //       //     )
  //       //   )
  //       // );
  //       // console.log("Seed2:", randoResult?.requestReference.toString());
  //       // console.log(
  //       //   "Signer1 Pubkey",
  //       //   JSON.stringify(
  //       //     Array.from(
  //       //       Uint8Array.from(
  //       //         new anchor.web3.PublicKey(
  //       //           "7xTBX131GqCe9BSuzATaerbJbzvGPzGkcYAtmfxmsKm2"
  //       //         ).toBuffer()
  //       //       )
  //       //     )
  //       //   )
  //       // );
  //       // const s1 = new anchor.web3.PublicKey(
  //       //   randoResult.oracleResults.slice(0, 64)
  //       // );
  //       // console.log("s1", s1.toString());
  //       // console.log(
  //       //   "Signer1 Results",
  //       //   JSON.stringify(randoResult.oracleResults.slice(0, 64))
  //       // );
  //       // console.log(
  //       //   "Signer2 Pubkey",
  //       //   JSON.stringify(
  //       //     Array.from(
  //       //       Uint8Array.from(
  //       //         new anchor.web3.PublicKey(
  //       //           "ChQyts7m59zHwsyRxVPaGiiHifC1Mpd9Eqc3mHSCiLyR"
  //       //         ).toBuffer()
  //       //       )
  //       //     )
  //       //   )
  //       // );
  //       // console.log(
  //       //   "Signer2 Results",
  //       //   JSON.stringify(randoResult.oracleResults.slice(64, 128))
  //       // );
  //       // const s2 = new anchor.web3.PublicKey(
  //       //   randoResult.oracleResults.slice(64, 128)
  //       // );
  //       // console.log("s2", s2.toString());
  //       // console.log(
  //       //   "Aggregated Array Result",
  //       //   JSON.stringify(Array.from(Uint8Array.from(randoResult.result)))
  //       // );
  //       console.log(
  //         "Random number result",
  //         new anchor.BN(
  //           Array.from(Uint8Array.from(randoResult.result))
  //         ).toString()
  //       );
  //       console.log(
  //         "Random number modded",
  //         parseInt(
  //           new anchor.BN(
  //             Array.from(Uint8Array.from(randoResult.result))
  //           ).toString()
  //         ) % 100
  //       );
  //     }
  //     // }
  //   );
  //   // console.log("randoProgram", JSON.stringify(randoProgram.idl));
  //   let vaultPub = new anchor.web3.PublicKey(
  //     "HynzMdt7y2NEtvhWzwjkqJNjuKoycLxQeK8HBfpGw8D8"
  //   );
  //   let vaultStolen = new anchor.web3.PublicKey(
  //     "8hVwUGfkz6GboXaPLWdWhf7x2zgpYULcLercfKzThNVR"
  //   );
  //   let [vaultSigner, nonce] = await anchor.web3.PublicKey.findProgramAddress(
  //     [
  //       Buffer.from(anchor.utils.bytes.utf8.encode("request-reference-seed")),
  //       ref.publicKey.toBuffer(),
  //     ],
  //     randoProgram.programId
  //   );
  //   console.log("ref", ref.publicKey.toString());
  //   console.log("vaultSigner", vaultSigner.toString());
  //   console.log("nonce", nonce);
  //   let tx = await randoProgram.rpc.request(nonce, {
  //     accounts: {
  //       requester: program.provider.wallet.publicKey,
  //       requestReference: ref.publicKey,
  //       vault: vaultSigner,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //     },
  //   });
  //   console.log("tx", tx);
  // });

  // it("Get Random", async () => {
  //   let tx = await program.rpc.getRandom({
  //     accounts: {
  //       signer: program.provider.wallet.publicKey,
  //       slotHashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY,
  //     },
  //   });
  //   console.log("tx", tx);
  // });

  // fund the ranch
  it("JollyRanch Funded", async () => {
    console.log(
      "sender token starting balance: ",
      await program.provider.connection.getTokenAccountBalance(
        wallet_token_account
      )
    );
    console.log(
      "receiver token balance: ",
      await program.provider.connection.getTokenAccountBalance(
        recieverSplAccount
      )
    );

    let amount = new anchor.BN(300000 * 1e6);
    console.log("amount", amount.toString());
    await program.rpc.fundRanch(amount, {
      accounts: {
        jollyranch: jollyranch,
        authority: program.provider.wallet.publicKey,
        senderSplAccount: wallet_token_account,
        recieverSplAccount: recieverSplAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      },
    });
    console.log(
      "sender token ending balance: ",
      await program.provider.connection.getTokenAccountBalance(
        wallet_token_account
      )
    );
    console.log(
      "receiver token balance: ",
      await program.provider.connection.getTokenAccountBalance(
        recieverSplAccount
      )
    );
  });

  // fund Pet

  // it("Funding with pets", async () => {
  //   // use your own NFT here ex Sea Shanty
  //   const nft = new PublicKey("EZeQooiusTDvmGpHuMNkxEqxSouag6rvYgvth9wbnmZ");
  //   const pet = anchor.web3.Keypair.generate();
  //   let [pet_spl, petBump] = await anchor.web3.PublicKey.findProgramAddress(
  //     [pet.publicKey.toBuffer()],
  //     program.programId
  //   );
  //   console.log("pet_spl", pet_spl.toString());
  //   let wallet_nft_account = await Token.getAssociatedTokenAddress(
  //     ASSOCIATED_TOKEN_PROGRAM_ID,
  //     TOKEN_PROGRAM_ID,
  //     nft,
  //     program.provider.wallet.publicKey
  //   );
  //   console.log("wallet_nft_account", wallet_nft_account.toString());
  //   await program.rpc.fundPet(petBump, {
  //     accounts: {
  //       authority: program.provider.wallet.publicKey,
  //       pet: pet.publicKey,
  //       senderSplAccount: wallet_nft_account,
  //       recieverSplAccount: pet_spl,
  //       mint: nft,
  //       systemProgram: anchor.web3.SystemProgram.programId,
  //       tokenProgram: TOKEN_PROGRAM_ID,
  //       rent: anchor.web3.SYSVAR_RENT_PUBKEY,
  //     },
  //     signers: [pet],
  //   });
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
