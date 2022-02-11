import * as anchor from "@project-serum/anchor";
import { Program, Provider, web3, Wallet } from "@project-serum/anchor";
import * as idl_type from "../target/idl/nft_staker.json";
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";

async function main(args: any) {
  const keypair = "../lib/SEA1xkZzPCUJBb5mcNb6ts9VExNr2kYMit3T5poqr94.json";

  const connection = new web3.Connection("https://api.mainnet-beta.solana.com");

  const wallet = web3.Keypair.fromSecretKey(
    new Uint8Array(JSON.parse(fs.readFileSync(keypair).toString()))
  );

  const anchorWallet = new Wallet(wallet);

  // console.log("anchorWallet", anchorWallet);

  const provider = new Provider(connection, anchorWallet, {
    preflightCommitment: "processed",
  });

  const petPalace = new anchor.web3.PublicKey(
    "4QpuL3VX1nak2NcpMxLTdowGR2cAf4oKZPa3WoHTNuz1"
  );
  // console.log("petPalace", petPalace);
  // console.log("petPalace", petPalace.toString());
  const idl = idl_type as anchor.Idl;

  const program = new Program(idl, petPalace.toString(), provider);
  // console.log("program got ran", program);
  // default behavior new jollyranch each test

  // const jollyranch = anchor.web3.Keypair.generate();
  // switch to pda account for same jollyranch testing

  // console.log("program", program);

  // console.log("program", program.programId.toString());

  // pda generation example
  let [jollyranch, jollyBump] = await anchor.web3.PublicKey.findProgramAddress(
    [Buffer.from("jolly_account")],
    program.programId
  );

  // console.log("jollyranch", jollyranch.toBase58());
  // console.log("jollyBump", jollyBump);

  // use your own token here ex CHEESE
  // devnet triton: 7RDibaGCRPSNBecU34AQPDioVYtgz1adYzPVaF4uryd9
  // const spl_token = new anchor.web3.PublicKey(
  //   "7RDibaGCRPSNBecU34AQPDioVYtgz1adYzPVaF4uryd9"
  // );
  const spl_token = new anchor.web3.PublicKey(
    "8rDACnycUMGFvndX74ZM9sxjEbR3gUpVHDjDbL4qW6Zf"
  );

  const [recieverSplAccount, splBump] =
    await anchor.web3.PublicKey.findProgramAddress(
      [jollyranch.toBuffer()],
      program.programId
    );
  // console.log("recieverSplAccount", recieverSplAccount.toBase58());
  // console.log("splBump", splBump);

  // console.log("wallet", wallet);
  // console.log("wallet pulbic key", wallet.publicKey.toString());

  let wallet_token_account = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    spl_token,
    wallet.publicKey
  );
  // console.log("wallet_token_account", wallet_token_account.toBase58());

  const jollyAccount = await program.account.jollyRanch.fetch(
    jollyranch.toString()
  );

  console.log("oracle running");
  console.log("");
  const a = program.provider.connection.onProgramAccountChange(
    program.programId,
    async (programAccount) => {
      // console.log("programAccount", programAccount);
      // console.log(
      //   "programAccount accountId",
      //   programAccount.accountId.toString()
      // );
      let breed = await program.account.breed.fetch(programAccount.accountId);
      // console.log("breed", breed);
      // console.log("breed", breed.oracle);
      if (!breed.oracle) {
        console.log("trying to parse breed:", breed.id.toString());
        let seed = Math.floor(Math.random() * (4294967295 - 0 + 1)) + 0;
        try {
          await program.rpc.oracle(seed, {
            accounts: {
              authority: program.provider.wallet.publicKey,
              breed: breed[0].publicKey,
            },
          });
          console.log("breed succesfully parsed");
        } catch {
          console.log("parsing breed failed run the failsafe");
        }
      }
    }
  );
}

if (require.main) main(process.argv.slice(2)).catch(console.error);
