import { web3, Program, Provider } from "@project-serum/anchor";
import { programs } from "@metaplex/js";
const {
  metadata: { Metadata },
} = programs;
import { fetchHashTable } from "../hooks/useHashTable";
import { MintLayout, TOKEN_PROGRAM_ID, Token } from "@solana/spl-token";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from "@solana/web3.js";
import axios from "axios";

import hashTable from "./hashTable.json";

const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new web3.PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const CANDY_MACHINE = "candy_machine";

export const CANDY_MACHINE_PROGRAM_ID = new web3.PublicKey(
  "cndyAnrLdpjq1Ssp1z8xxDsB8dxe7u4HL5Nxi2K5WXZ"
);

const getTokenWallet = async function (wallet: PublicKey, mint: PublicKey) {
  return (
    await PublicKey.findProgramAddress(
      [wallet.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
      SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID
    )
  )[0];
};

const createAssociatedTokenAccountInstruction = (
  associatedTokenAddress: PublicKey,
  payer: PublicKey,
  walletAddress: PublicKey,
  splTokenMintAddress: PublicKey
) => {
  const keys = [
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: associatedTokenAddress,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: walletAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: splTokenMintAddress,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  return new TransactionInstruction({
    keys,
    programId: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    data: Buffer.from([]),
  });
};

export const getCandyMachine = async (config: web3.PublicKey, uuid: string) => {
  return await web3.PublicKey.findProgramAddress(
    [Buffer.from(CANDY_MACHINE), config.toBuffer(), Buffer.from(uuid)],
    CANDY_MACHINE_PROGRAM_ID
  );
};

const getMetadata = async (mint: web3.PublicKey): Promise<web3.PublicKey> => {
  return (
    await web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
};

const getMasterEdition = async (
  mint: web3.PublicKey
): Promise<web3.PublicKey> => {
  return (
    await web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mint.toBuffer(),
        Buffer.from("edition"),
      ],
      TOKEN_METADATA_PROGRAM_ID
    )
  )[0];
};

export const mintOneToken = async (
  wallet: WalletContextState,
  tokens_to_mint: number,
  setStatus: any
): Promise<string[]> => {
  var endpoint = "";
  if (process.env.NEXT_PUBLIC_SELECTED_ENDPOINT == "quicknode-devnet") {
    endpoint = process.env.NEXT_PUBLIC_QUICKNODE_DEVNET_RPC_ENDPOINT;
  } else if (
    process.env.NEXT_PUBLIC_SELECTED_ENDPOINT == "quicknode-mainnet-beta"
  ) {
    endpoint = JSON.parse(
      process.env.NEXT_PUBLIC_QUICKNODE_MAINNET_BETA_RPC_ENDPOINT
    );
    endpoint = endpoint[Math.floor(Math.random() * endpoint.length)];
  } else if (process.env.NEXT_PUBLIC_SELECTED_ENDPOINT == "solana-devnet") {
    endpoint = process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_ENDPOINT;
  }

  const solConnection = new web3.Connection(endpoint, "processed");

  // const solPriceStr = program.getOptionValue('price') || '1';
  // const lamports = parseInt(solPriceStr) * LAMPORTS_PER_SOL;

  const anchorWallet = {
    publicKey: wallet.publicKey,
    signAllTransactions: wallet.signAllTransactions,
    signTransaction: wallet.signTransaction,
  };
  const provider = new Provider(solConnection, anchorWallet, {
    preflightCommitment: "processed",
  });

  type SendTxRequest = {
    tx: web3.Transaction;
    signers: Array<web3.Signer | undefined>;
  };

  // custom sendAll function to make things feel snappier
  provider.sendAll = async function (
    reqs: Array<SendTxRequest>,
    setStatus: any,
    opts?: web3.ConfirmOptions
  ): Promise<Array<web3.TransactionSignature>> {
    if (opts === undefined) {
      opts = this.opts;
    }
    const blockhash = await this.connection.getRecentBlockhash(
      opts.preflightCommitment
    );

    let txs = reqs.map((r) => {
      let tx = r.tx;
      let signers = r.signers;

      if (signers === undefined) {
        signers = [];
      }

      tx.feePayer = this.wallet.publicKey;
      tx.recentBlockhash = blockhash.blockhash;

      signers
        .filter((s) => s !== undefined)
        .forEach((kp) => {
          tx.partialSign(kp);
        });

      return tx;
    });

    const signedTxs = await this.wallet.signAllTransactions(txs);

    const sigs = [];

    for (let k = 0; k < txs.length; k += 1) {
      const tx = signedTxs[k];
      const rawTx = tx.serialize();
      setStatus(`Sending transaction ${k + 1}/${txs.length}`);
      sigs.push(
        await web3.sendAndConfirmRawTransaction(this.connection, rawTx, opts)
      );
    }

    return sigs;
  };

  const idl = await Program.fetchIdl(CANDY_MACHINE_PROGRAM_ID, provider);
  const anchorProgram = new Program(idl, CANDY_MACHINE_PROGRAM_ID, provider);
  // console.log("anchorProgram", anchorProgram);
  const config = new web3.PublicKey(
    process.env.NEXT_PUBLIC_CANDY_MACHINE_CACHE_PROGRAM_CONFIG
  );
  const [candyMachine] = await getCandyMachine(
    config,
    process.env.NEXT_PUBLIC_CANDY_MACHINE_CACHE_PROGRAM_UUID
  );

  const candy = await anchorProgram.account.candyMachine.fetch(candyMachine);

  const multiTx = [];
  for (let i = 0; i < tokens_to_mint; i++) {
    setStatus(`Building transaction ${i + 1}/${tokens_to_mint}`);
    let txObj = {};
    const mint = web3.Keypair.generate();
    const token = await getTokenWallet(wallet.publicKey, mint.publicKey);
    const metadata = await getMetadata(mint.publicKey);
    const masterEdition = await getMasterEdition(mint.publicKey);

    txObj["tx"] = anchorProgram.transaction.mintNft({
      accounts: {
        config: config,
        candyMachine: candyMachine,
        payer: wallet.publicKey,
        //@ts-ignore
        wallet: candy.wallet,
        mint: mint.publicKey,
        metadata,
        masterEdition,
        mintAuthority: wallet.publicKey,
        updateAuthority: wallet.publicKey,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: web3.SYSVAR_RENT_PUBKEY,
        clock: web3.SYSVAR_CLOCK_PUBKEY,
      },
      signers: [mint],
      instructions: [
        web3.SystemProgram.createAccount({
          // basePubkey: mint.publicKey,
          fromPubkey: wallet.publicKey,
          newAccountPubkey: mint.publicKey,
          space: MintLayout.span,
          lamports: await provider.connection.getMinimumBalanceForRentExemption(
            MintLayout.span
          ),
          programId: TOKEN_PROGRAM_ID,
          // seed: seed,
        }),
        Token.createInitMintInstruction(
          TOKEN_PROGRAM_ID,
          mint.publicKey,
          0,
          wallet.publicKey,
          wallet.publicKey
        ),
        createAssociatedTokenAccountInstruction(
          token,
          wallet.publicKey,
          wallet.publicKey,
          mint.publicKey
        ),
        Token.createMintToInstruction(
          TOKEN_PROGRAM_ID,
          mint.publicKey,
          token,
          wallet.publicKey,
          [],
          1
        ),
      ],
    });
    txObj["signers"] = [mint];
    multiTx.push(txObj);
  }
  setStatus(`Waiting for wallet to confirm...`);
  let tx;
  try {
    tx = await provider.sendAll(multiTx, setStatus);
  } catch (err) {
    let error = err.toString();
    if (error.includes("0x137")) {
      setStatus(`SOLD OUT OF NFTS`);
    }
  }
  return tx;
};

// add anchor specific awaitTx func.
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const awaitTransactionSignatureConfirmation = async (
  txid: web3.TransactionSignature,
  timeout: number,
  connection: web3.Connection,
  commitment: web3.Commitment = "processed",
  queryStatus = false
): Promise<web3.SignatureStatus> => {
  let done = false;
  let status: web3.SignatureStatus = {
    slot: 0,
    confirmations: 0,
    err: null,
  };
  let subId = 0;
  status = await new Promise(async (resolve, reject) => {
    setTimeout(() => {
      if (done) {
        return;
      }
      done = true;
      console.log("Rejecting for timeout...");
      reject({ timeout: true });
    }, timeout);
    try {
      subId = connection.onSignature(
        txid,
        (result: any, context: any) => {
          done = true;
          status = {
            err: result.err,
            slot: context.slot,
            confirmations: 0,
          };
          if (result.err) {
            console.log("Rejected via websocket", result.err);
            reject(status);
          } else {
            console.log("Resolved via websocket", result);
            resolve(status);
          }
        },
        commitment
      );
    } catch (e) {
      done = true;
      console.error("WS error in setup", txid, e);
    }
    while (!done && queryStatus) {
      // eslint-disable-next-line no-loop-func
      (async () => {
        try {
          const signatureStatuses = await connection.getSignatureStatuses([
            txid,
          ]);
          status = signatureStatuses && signatureStatuses.value[0];
          if (!done) {
            if (!status) {
              console.log("REST null result for", txid, status);
            } else if (status.err) {
              console.log("REST error for", txid, status);
              done = true;
              reject(status.err);
            } else if (!status.confirmations) {
              console.log("REST no confirmations for", txid, status);
            } else {
              console.log("REST confirmation for", txid, status);
              done = true;
              resolve(status);
            }
          }
        } catch (e) {
          if (!done) {
            console.log("REST connection error: txid", txid, e);
          }
        }
      })();
      await sleep(2000);
    }
  });

  //@ts-ignore
  if (connection._signatureSubscriptions[subId]) {
    connection.removeSignatureListener(subId);
  }
  done = true;
  console.log("Returning status", status);
  return status;
};

export async function getNftsForOwner(
  connection: web3.Connection,
  ownerAddress: web3.PublicKey
) {
  // console.log("started getNftsForOwner");
  // const allMintsCandyMachine = await fetchHashTable(
  //   process.env.NEXT_PUBLIC_CANDY_MACHINE_ID!
  // );

  const allMintsCandyMachine = hashTable;

  // console.log("allMintsCandyMachine", allMintsCandyMachine);

  // console.log("fetched mint hashes");
  const allTokens: any = [];
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    ownerAddress,
    {
      programId: TOKEN_PROGRAM_ID,
    }
  );

  // console.log("got token accounts", tokenAccounts);

  for (let index = 0; index < tokenAccounts.value.length; index++) {
    const tokenAccount = tokenAccounts.value[index];
    const tokenAmount = tokenAccount.account.data.parsed.info.tokenAmount;

    if (
      tokenAmount.amount == "1" &&
      tokenAmount.decimals == "0" &&
      allMintsCandyMachine.includes(tokenAccount.account.data.parsed.info.mint)
    ) {
      let [pda] = await web3.PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          new web3.PublicKey(
            tokenAccount.account.data.parsed.info.mint
          ).toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      const accountInfo: any = await connection.getParsedAccountInfo(pda);

      const metadata: any = new Metadata(
        ownerAddress.toString(),
        accountInfo.value
      );
      const { data }: any = await axios.get(metadata.data.data.uri);
      // console.log("got nft metadata");
      // console.log("accountInfo.value", accountInfo.value);
      // console.log("metadata", metadata);
      // console.log("metadata", metadata.data);
      // console.log("metadata", metadata.data.data);
      const entireData = {
        ...data,
        id: Number(data.name.replace(/^\D+/g, "").split(" - ")[0]),
        mint: metadata.data.mint,
      };

      allTokens.push({ ...entireData });
    }
    allTokens.sort(function (a: any, b: any) {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
  }

  return allTokens;
}
