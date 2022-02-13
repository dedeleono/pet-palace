import * as anchor from "@project-serum/anchor";
import { Program, Provider, web3, Wallet } from "@project-serum/anchor";
import * as idl_type from "../target/idl/nft_staker.json";
import * as bs58 from "bs58";
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as fs from "fs";

async function main(args: any) {
  const keypair = "../lib/SEA1xkZzPCUJBb5mcNb6ts9VExNr2kYMit3T5poqr94.json";

  const connection = new web3.Connection(
    "https://crimson-withered-water.solana-mainnet.quiknode.pro/1fe9db637760863cd9720e3f325a1f6d6f15a5c9/"
  );

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

  console.log("oracle running");
  console.log("");
  async function runOracle() {
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
      const missedBreeds = await program.account.breed.all([
        {
          memcmp: {
            offset: 8 + 32 + 8 + 8 + 8 + 1 + 1 + 1,
            // bytes: bs58.encode(wallet.publicKey.toBuffer()),
            bytes: bs58.encode(new Uint8Array([0])),
          },
        },
      ]);
      // console.log("missedBreeds", missedBreeds);
      for (let i = 0; i < missedBreeds.length; i++) {
        const breed = missedBreeds[i];
        if (!breed.account.oracle) {
          console.log("parsing breed:", breed.account.id.toString());
          let seed = Math.floor(Math.random() * (4294967295 - 0 + 1)) + 0;
          await program.rpc.oracle(seed, {
            accounts: {
              authority: program.provider.wallet.publicKey,
              breed: breed.publicKey,
            },
          });
        }
      }
    }
  }

  runOracle();
}

if (require.main) main(process.argv.slice(2)).catch(console.error);
