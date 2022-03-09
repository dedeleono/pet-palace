import * as anchor from "@project-serum/anchor";
import { Program, Provider, BN } from "@project-serum/anchor";
import { ConfirmOptions, PublicKey } from "@solana/web3.js";
import * as bs58 from "bs58";
import {
  Token,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import type { NextPage } from "next";
import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet } from "@solana/wallet-adapter-react";
import idl_type from "../../target/idl/nft_staker.json";
import { getNftsForOwner } from "../lib/mint-one-token";
import { programs } from "@metaplex/js";
import NFTLoader from "../components/NFTLoader";
import Navigation from "../components/Navigation";
import Bg from "../public/images/out.jpeg";
import { sortBy } from "lodash";
import Header from "../components/Header";

const {
  metadata: { Metadata },
} = programs;

type jollyProgramState = {
  program: any;
  connection: any;
  jollyranch: any;
  jollyBump: any;
  recieverSplAccount: any;
  spl_token: any;
  splBump: any;
  wallet_token_account: any;
  jollyAccount: any;
};

const Home: NextPage = () => {
  const wallet = useWallet();
  const [jollyState, setJollyState] = useState({} as jollyProgramState);
  const [breeds, setBreeds] = useState([]);
  const [rolls, setRolls] = useState([]);
  const [stakedNFTs, setStakedNFTs] = useState([]);
  const [stakedMints, setStakedMints] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [loadingNfts, setLoadingNfts] = useState(true);
  const [loadingStakes, setLoadingStakes] = useState(true);
  const [loadingBreeds, setLoadingBreeds] = useState(true);
  const [stakingRewards, setStakingRewards] = useState({});
  const [refreshStateCounter, setRefreshStateCounter] = useState(0);
  const [totalRatsStaked, setTotaRatsStaked] = useState(0);
  const [isBreed, setIsBreed] = useState(true);
  const [isRolls, setIsRolls] = useState(false);
  const [breedStake, setBreedStake] = useState(null);
  const [nftStakeArray, setNftStakeArray] = useState([]);
  const [tritonAmount, setTritonAmount] = useState({
    breed: false,
    tame: false,
    freshHaircut: false,
    bowTie: false,
    jewelry: false,
    kingsCrown: false,
    bait: false,
    hook: false,
    poseidonWhistle: false,
  });

  const [checkbox, setCheckBox] = useState({
    freshHaircut: false,
    bowTie: false,
    jewelry: false,
    kingsCrown: false,
    bait: false,
    hook: false,
    poseidonWhistle: false,
  });

  const [successCatch, setSuccessCatch] = useState(10);
  const [catchTotal, setCatchTotal] = useState(150);

  const [petsLeft, setPetsLeft] = useState([]);

  const breederRef = useRef(null);
  const loaderRef = useRef(null);
  const modalRef = useRef(null);
  const [loader, setLoader] = useState(0);

  const txTimeout = 10000;

  const test = new anchor.web3.Keypair();

  // console.log("test", test.publicKey.toString());

  const calculateCatch = (tritonAmount) => {
    setSuccessCatch(10);
    let triton = 0;
    let percentage = 10;
    if (tritonAmount.tame) {
      triton += 150;
      if (tritonAmount.bait) {
        triton += 225;
        percentage += 15;
      }
      if (tritonAmount.hook) {
        triton += 300;
        percentage += 20;
      }
      if (tritonAmount.poseidonWhistle) {
        triton += 1000;
        percentage += 50;
      }
    } else if (tritonAmount.breed) {
      triton += 120;
      if (tritonAmount.freshHaircut) {
        triton += 42;
        percentage += 3;
      }
      if (tritonAmount.bowTie) {
        triton += 210;
        percentage += 15;
      }
      if (tritonAmount.jewelry) {
        triton += 270;
        percentage += 20;
      }
      if (tritonAmount.kingsCrown) {
        triton += 1000;
        percentage += 50;
      }
    }

    setSuccessCatch(percentage);
    setCatchTotal(triton);
  };

  const refresh = async () => {
    setLoader(0);
    loaderRef.current.click();
    const downloadTimer = setInterval(() => {
      if (loader >= 5000) {
        clearInterval(downloadTimer);
      }
      setLoader((prevLoader) => prevLoader + 10);
    }, 10);
    setTimeout(() => {
      modalRef.current.click();
      // forceUpdate();
      setRefreshStateCounter(refreshStateCounter + 1);
      // refreshData();
    }, txTimeout + 10);
  };

  const idl = idl_type as anchor.Idl;

  const stakeNFT = async (publicKeys) => {
    const stake = anchor.web3.Keypair.generate();
    let stake_spls = [];
    let stake_bumps = [];
    let stake_mints = [];
    let wallet_nft_accounts = [];
    for (let i = 0; i < publicKeys.length; i++) {
      const nft = new anchor.web3.PublicKey(publicKeys[i].mint.toString());

      // console.log("nft", nft.toString());
      // console.log("cheese", cheese);
      // console.log("lockup", lockup);
      let [stake_spl, stakeBump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [stake.publicKey.toBuffer(), nft.toBuffer()],
          jollyState.program.programId
        );
      let wallet_nft_account = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        nft,
        wallet.publicKey
      );

      // check if token has an associated account
      // if not send from the wallet account
      const largestAccounts =
        await jollyState.connection.getTokenLargestAccounts(nft);
      // console.log("largestAccounts", largestAccounts);
      // const largestAccountInfo = await jollyState.connection.getParsedAccountInfo(
      //   largestAccounts.value[0].address
      // );
      // console.log(
      //   "largestAccounts.value[0].address",
      //   largestAccounts.value[0].address.toString()
      // );
      // console.log(largestAccountInfo.value.data.parsed.info.owner);
      const hasATA =
        largestAccounts.value[0].address.toString() ===
        wallet_nft_account.toString();
      if (!hasATA) {
        wallet_nft_account = largestAccounts.value[0].address;
      }

      stake_spls.push(stake_spl);
      stake_bumps.push(stakeBump);
      stake_mints.push(nft);
      wallet_nft_accounts.push(wallet_nft_account);
    }

    if (stake_mints.length < 4) {
      for (let j = 0; j <= 5 - stake_mints.length; j++) {
        stake_spls.push(stake_spls[0]);
        stake_bumps.push(stake_bumps[0]);
        stake_mints.push(stake_mints[0]);
        wallet_nft_accounts.push(wallet_nft_accounts[0]);
      }
    }
    // console.log("stake_mints", stake_mints);

    // console.log("wallet_nft_account", wallet_nft_account.toString());
    await jollyState.program.rpc.stakeNft(stake_bumps, {
      accounts: {
        authority: wallet.publicKey.toString(),
        stake: stake.publicKey.toString(),
        senderSplAccount0: wallet_nft_accounts[0].toString(),
        senderSplAccount1: wallet_nft_accounts[1].toString(),
        senderSplAccount2: wallet_nft_accounts[2].toString(),
        senderSplAccount3: wallet_nft_accounts[3].toString(),
        recieverSplAccount0: stake_spls[0].toString(),
        recieverSplAccount1: stake_spls[1].toString(),
        recieverSplAccount2: stake_spls[2].toString(),
        recieverSplAccount3: stake_spls[3].toString(),
        mint0: stake_mints[0].toString(),
        mint1: stake_mints[1].toString(),
        mint2: stake_mints[2].toString(),
        mint3: stake_mints[3].toString(),
        systemProgram: anchor.web3.SystemProgram.programId.toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString(),
      },
      signers: [stake],
    });
  };

  const setupJollyRanch = async () => {
    const opts = {
      preflightCommitment: "processed" as ConfirmOptions,
    };
    let endpoint = JSON.parse(
      process.env.NEXT_PUBLIC_QUICKNODE_MAINNET_BETA_RPC_ENDPOINT
    );
    endpoint = endpoint[Math.floor(Math.random() * endpoint.length)];
    const network = endpoint;
    const connection = new anchor.web3.Connection(
      network,
      opts.preflightCommitment
    );

    const provider = new Provider(connection, wallet, opts.preflightCommitment);
    const petPalace = new anchor.web3.PublicKey(
      "4QpuL3VX1nak2NcpMxLTdowGR2cAf4oKZPa3WoHTNuz1"
    );
    // console.log("petPalace", petPalace);
    // console.log("petPalace", petPalace.toString());
    const program = new Program(idl, petPalace.toString(), provider);
    // console.log("program got ran", program);
    // default behavior new jollyranch each test

    // const jollyranch = anchor.web3.Keypair.generate();
    // switch to pda account for same jollyranch testing

    // console.log("program", program);

    // console.log("program", program.programId.toString());

    // pda generation example
    let [jollyranch, jollyBump] =
      await anchor.web3.PublicKey.findProgramAddress(
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
    // console.log("jollyAccount", jollyAccount);
    // console.log("jollyAccount.amount", jollyAccount.amount.toString());
    // console.log(
    //   "jollyAccount.amountRedeemed",
    //   jollyAccount.amountRedeemed.toString()
    // );
    // console.log("program", program);
    // console.log("jollyAccount", jollyAccount);
    // console.log("jollyAccount amount", jollyAccount.amount.toNumber());
    // console.log(
    //   "jollyAccount amount redeemed",
    //   jollyAccount.amountRedeemed.toNumber()
    // );
    setJollyState({
      program,
      connection,
      jollyranch,
      jollyBump,
      recieverSplAccount,
      spl_token,
      splBump,
      wallet_token_account,
      jollyAccount,
    });
  };

  const getNftData = async (nft_public_key) => {
    // console.log("nft_public_key", nft_public_key);
    const tokenAccount = new anchor.web3.PublicKey(nft_public_key);
    const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
      "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
    );
    let [pda] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        new anchor.web3.PublicKey(tokenAccount.toString()).toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );
    const accountInfo: any = await jollyState.connection.getParsedAccountInfo(
      pda
    );

    const metadata: any = new Metadata(
      wallet.publicKey.toString(),
      accountInfo.value
    );
    const { data }: any = await axios.get(metadata.data.data.uri);
    return data;
  };

  const getStakedNfts = async () => {
    // console.log("jollyState program", jollyState.program);
    let unWithdrawnNFTs = [];
    const newStakedNFTs = await jollyState.program.account.stake.all([
      {
        memcmp: {
          offset: 8, // Discriminator
          // bytes: bs58.encode(wallet.publicKey.toBuffer()),
          bytes: wallet.publicKey.toBase58(),
        },
      },
    ]);
    // console.log("newStakedNFTs", newStakedNFTs);
    await newStakedNFTs.map((stake) => {
      if (stake.account.withdrawn === false) {
        unWithdrawnNFTs.push(stake);
      }
    });
    // console.log("setting newStakedNFTs to unWithdrawnNFTs", unWithdrawnNFTs);

    setStakedNFTs(unWithdrawnNFTs);
    // console.log("stakedNfts on load:", stakedNfts);
    // return stakedNfts;
  };

  const getStakedMints = async () => {
    // console.log("running getStakedMints with these nft accounts:", stakedNFTs);
    let allStakedMints = await Promise.all(
      stakedNFTs.map(async (nft_account, i) => {
        // console.log("nft_account", nft_account);
        let [stake_spl, _stakeBump] =
          await anchor.web3.PublicKey.findProgramAddress(
            [
              nft_account.publicKey.toBuffer(),
              nft_account.account.mints[0].toBuffer(),
            ],
            jollyState.program.programId
          );
        // console.log("stake_spl", stake_spl);
        // console.log("stake_spl", stake_spl.toString());

        let endpoint = JSON.parse(
          process.env.NEXT_PUBLIC_QUICKNODE_MAINNET_BETA_RPC_ENDPOINT
        );
        endpoint = endpoint[Math.floor(Math.random() * endpoint.length)];

        const nft_public_key = await axios
          .post(endpoint, {
            jsonrpc: "2.0",
            id: 1,
            method: "getAccountInfo",
            params: [
              stake_spl.toString(),
              {
                encoding: "jsonParsed",
              },
            ],
          })
          .then(async (res) => {
            // console.log("res", res);
            // console.log("res.data.result", res.data.result);
            // console.log(
            //   "returned res data in getStakedMints:",
            //   res.data.result.value.data.parsed
            // );
            return res.data.result.value?.data.parsed.info.mint;
          });

        // console.log("nft_public_key", nft_public_key);
        if (nft_public_key) {
          let nft = await getNftData(nft_public_key);
          nft["nft_account"] = nft_account;
          nft["nft_account"].id = i;
          // console.log("running pushed nft to mints", nft);
          // allStakedMints.push(nft);
          return nft;
        }
      })
    );
    // console.log("allStakedMints", allStakedMints);
    allStakedMints.map((nft) => {
      if (nft) {
        // console.log("nft", nft);
        const mints = [
          "8jDN1VYpCtk6gYxuRrEww8vnjbaKiaZexy145CVNyEoM",
          "57LZHdfcb4G5unkLaJKWqSUy4mpWAoCtCXj4hB6cZHgF",
          "54KFLjw4ywGWzNeh6o8LrHEP8mTjiBRX4DrNjWGiMUhT",
          "GvQF2vpWKWhv2LEyEurP5koNRFrA6s7Hx66zsv536KeC",
        ];
        let redemption_rate = 1;
        if (nft.nft_account.account.stakeAmount == 2) {
          redemption_rate = 4.0;
        } else if (nft.nft_account.account.stakeAmount == 3) {
          redemption_rate = 12.0;
        } else if (nft.nft_account.account.stakeAmount == 4) {
          redemption_rate = 32.0;
        }
        // console.log("nft", nft.nft_account.account.mint.toString());
        if (
          mints.includes(nft.nft_account.account.mints[0].toString()) ||
          mints.includes(nft.nft_account.account.mints[1].toString()) ||
          mints.includes(nft.nft_account.account.mints[2].toString()) ||
          mints.includes(nft.nft_account.account.mints[3].toString())
        ) {
          if (nft.nft_account.account.stakeAmount == 1) {
            redemption_rate = 10.0;
          } else if (nft.nft_account.account.stakeAmount == 2) {
            redemption_rate = 22.0;
          } else if (nft.nft_account.account.stakeAmount == 3) {
            redemption_rate = 48.0;
          } else if (nft.nft_account.account.stakeAmount == 4) {
            redemption_rate = 104.0;
          }
        }
        const currDate = new Date().getTime() / 1000;
        const daysElapsed =
          Math.abs(currDate - nft.nft_account.account.startDate) /
          (60 * 60 * 24);
        const amountRedeemed =
          nft.nft_account.account.amountRedeemed.toNumber() / 1e6;
        // console.log(
        //   "amountRedeemed",
        //   nft.nft_account.account.amountRedeemed.toNumber() / 1e6
        // );
        let estimateRewards = redemption_rate * daysElapsed - amountRedeemed;
        stakingRewards[nft.nft_account.id.toString()] = estimateRewards;
      }
    });
    setStakingRewards({ ...stakingRewards });
    // setInterval(() => {
    //   allStakedMints.map((nft) => {
    //     let percentage =
    //       (new Date().getTime() / 1000 -
    //         parseInt(nft.nft_account.account.startDate)) /
    //       (parseInt(nft.nft_account.account.endDate) -
    //         parseInt(nft.nft_account.account.startDate));
    //     let estimateRewards =
    //       nft.nft_account.account.amountOwed.toNumber() * percentage -
    //       nft.nft_account.account.amountRedeemed.toNumber();
    //     stakingRewards[nft.nft_account.id.toString()] =
    //       estimateRewards;
    //   });
    //   setStakingRewards({ ...stakingRewards });
    // }, 3000);
    // console.log("setStakedMints", allStakedMints);
    setLoadingStakes(false);
    // console.log("allstaked mints:", allStakedMints);
    setStakedMints(allStakedMints.filter((e) => e));
  };

  const redeemRewards = async (nftPubKey) => {
    await jollyState.program.rpc.redeemRewards({
      accounts: {
        stake: nftPubKey.toString(),
        jollyranch: jollyState.jollyranch.toString(),
        authority: jollyState.program.provider.wallet.publicKey.toString(),
        senderSplAccount: jollyState.recieverSplAccount.toString(),
        recieverSplAccount: jollyState.wallet_token_account.toString(),
        mint: jollyState.spl_token.toString(),
        systemProgram: anchor.web3.SystemProgram.programId.toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
        rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString(),
      },
    });
    // console.log(
    //   "sender token ending balance: ",
    //   await jollyState.program.provider.connection.getTokenAccountBalance(
    //     jollyState.wallet_token_account
    //   )
    // );
  };

  const redeemNFT = async (stakePubKey, nftPubKeys) => {
    console.log("stakesPubKey", stakePubKey.toString());
    console.log("nftPubKeys", nftPubKeys[0].toString());
    console.log("nftPubKeys", nftPubKeys[1].toString());
    console.log("nftPubKeys", nftPubKeys[2].toString());
    console.log("nftPubKeys", nftPubKeys[3].toString());
    let stake_spls = [];
    let stake_bumps = [];
    let wallet_nft_accounts = [];
    for (let i = 0; i < nftPubKeys.length; i++) {
      // console.log("nft", nft.toString());
      // console.log("cheese", cheese);
      // console.log("lockup", lockup);
      let [stake_spl, stakeBump] =
        await anchor.web3.PublicKey.findProgramAddress(
          [stakePubKey.toBuffer(), nftPubKeys[i].toBuffer()],
          jollyState.program.programId
        );
      let wallet_nft_account = await Token.getAssociatedTokenAddress(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        nftPubKeys[i],
        wallet.publicKey
      );

      stake_spls.push(stake_spl);
      stake_bumps.push(stakeBump);
      wallet_nft_accounts.push(wallet_nft_account);
    }

    const tx = new anchor.web3.Transaction();
    let redeemRewards_ix = await jollyState.program.instruction.redeemRewards({
      accounts: {
        stake: stakePubKey.toString(),
        jollyranch: jollyState.jollyranch.toString(),
        authority: jollyState.program.provider.wallet.publicKey.toString(),
        senderSplAccount: jollyState.recieverSplAccount.toString(),
        recieverSplAccount: jollyState.wallet_token_account.toString(),
        mint: jollyState.spl_token.toString(),
        systemProgram: anchor.web3.SystemProgram.programId.toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
        rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString(),
      },
    });
    let initAtas_ix = await jollyState.program.instruction.initAtas({
      accounts: {
        authority: jollyState.program.provider.wallet.publicKey.toString(),
        recieverNftAccount0: wallet_nft_accounts[0].toString(),
        recieverNftAccount1: wallet_nft_accounts[1].toString(),
        recieverNftAccount2: wallet_nft_accounts[2].toString(),
        recieverNftAccount3: wallet_nft_accounts[3].toString(),
        nft0: nftPubKeys[0].toString(),
        nft1: nftPubKeys[1].toString(),
        nft2: nftPubKeys[2].toString(),
        nft3: nftPubKeys[3].toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
        systemProgram: anchor.web3.SystemProgram.programId.toString(),
        rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString(),
      },
    });
    let redeemNft_ix = await jollyState.program.instruction.redeemNft({
      accounts: {
        stake: stakePubKey.toString(),
        jollyranch: jollyState.jollyranch.toString(),
        authority: jollyState.program.provider.wallet.publicKey.toString(),
        senderNftAccount0: stake_spls[0].toString(),
        senderNftAccount1: stake_spls[1].toString(),
        senderNftAccount2: stake_spls[2].toString(),
        senderNftAccount3: stake_spls[3].toString(),
        recieverNftAccount0: wallet_nft_accounts[0].toString(),
        recieverNftAccount1: wallet_nft_accounts[1].toString(),
        recieverNftAccount2: wallet_nft_accounts[2].toString(),
        recieverNftAccount3: wallet_nft_accounts[3].toString(),
        senderTritonAccount: jollyState.recieverSplAccount.toString(),
        recieverTritonAccount: jollyState.wallet_token_account.toString(),
        mint: jollyState.spl_token.toString(),
        nft0: nftPubKeys[0].toString(),
        nft1: nftPubKeys[1].toString(),
        nft2: nftPubKeys[2].toString(),
        nft3: nftPubKeys[3].toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
        systemProgram: anchor.web3.SystemProgram.programId.toString(),
        rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString(),
      },
    });

    tx.add(redeemRewards_ix);
    tx.add(initAtas_ix);
    tx.add(redeemNft_ix);

    try {
      console.log("sendingTx");
      await jollyState.program.provider.send(tx);
    } catch (err) {
      console.log(err);
    }
  };

  const getTotalStakedRats = async () => {
    // console.log("runnning total staked rats");
    let totalStillStaked = 0;
    const totalStaked = await jollyState.program.account.stake.all();
    // console.log("totalStaked", totalStaked);
    // if (totalStaked[0]) {
    //   console.log("totalStaked", totalStaked[0].account.authority.toString());
    // }
    await totalStaked.map((stake) => {
      if (stake.account.withdrawn === false) {
        totalStillStaked++;
      }
    });
    setTotaRatsStaked(totalStillStaked);
  };

  const tamePet = async (stake?) => {
    console.log("tritonAmount", tritonAmount);
    const breed = new anchor.web3.Keypair();
    let triton = 0;
    if (tritonAmount.breed) {
      console.log("Pet Breeding Ran");
      triton += 120;
      if (tritonAmount.freshHaircut) {
        triton += 42;
      }
      if (tritonAmount.bowTie) {
        triton += 210;
      }
      if (tritonAmount.jewelry) {
        triton += 270;
      }
      if (tritonAmount.kingsCrown) {
        triton += 1000;
      }
      await jollyState.program.rpc.breedPet(new BN(triton), {
        accounts: {
          authority: wallet.publicKey.toString(),
          breed: breed.publicKey.toString(),
          stake: stake.nft_account.publicKey.toString(),
          jollyranch: jollyState.jollyranch.toString(),
          trtnAccount: jollyState.recieverSplAccount.toString(),
          authTrtnAccount: jollyState.wallet_token_account.toString(),
          slotHashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY.toString(),
          tokenProgram: TOKEN_PROGRAM_ID.toString(),
          systemProgram: anchor.web3.SystemProgram.programId.toString(),
        },
        signers: [breed],
      });
    }
    if (tritonAmount.tame) {
      triton += 150;
      console.log("Pet training Ran");
      if (tritonAmount.bait) {
        triton += 225;
      }
      if (tritonAmount.hook) {
        triton += 300;
      }
      if (tritonAmount.poseidonWhistle) {
        triton += 1000;
      }
      await jollyState.program.rpc.trainPet(new BN(triton), {
        accounts: {
          authority: wallet.publicKey.toString(),
          breed: breed.publicKey.toString(),
          jollyranch: jollyState.jollyranch.toString(),
          trtnAccount: jollyState.recieverSplAccount.toString(),
          authTrtnAccount: jollyState.wallet_token_account.toString(),
          slotHashes: anchor.web3.SYSVAR_SLOT_HASHES_PUBKEY.toString(),
          tokenProgram: TOKEN_PROGRAM_ID.toString(),
          systemProgram: anchor.web3.SystemProgram.programId.toString(),
        },
        signers: [breed],
      });
    }
    setTritonAmount({
      breed: false,
      tame: false,
      freshHaircut: false,
      bowTie: false,
      jewelry: false,
      kingsCrown: false,
      bait: false,
      hook: false,
      poseidonWhistle: false,
    });
  };

  const getPetsLeft = async () => {
    const redeemablePets = await jollyState.program.account.pet.all([
      {
        memcmp: {
          offset: 8 + 32 + 32 + 1, // Discriminator
          // bytes: bs58.encode(wallet.publicKey.toBuffer()),
          bytes: bs58.encode(new Uint8Array([0])),
        },
      },
    ]);
    // console.log("redeemablePets", redeemablePets);
    redeemablePets.map((pet) => {
      if (pet.account.withdrawn === true) {
        console.log("found withdrawn pet");
      }
    });
    setPetsLeft(redeemablePets);
  };

  const redeemPet = async (breed) => {
    const redeemablePets = await jollyState.program.account.pet.all([
      {
        memcmp: {
          offset: 8 + 32 + 32 + 1, // Discriminator
          // bytes: bs58.encode(wallet.publicKey.toBuffer()),
          bytes: bs58.encode(new Uint8Array([0])),
        },
      },
    ]);
    // console.log("redeemablePets", redeemablePets);
    const selectedPet =
      redeemablePets[Math.floor(Math.random() * redeemablePets.length)];

    const nft = new PublicKey(selectedPet.account.mint.toString());
    let wallet_nft_account = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      nft,
      jollyState.program.provider.wallet.publicKey
    );

    let [pet_spl, petBump] = await anchor.web3.PublicKey.findProgramAddress(
      [selectedPet.publicKey.toBuffer()],
      jollyState.program.programId
    );
    console.log("pet_spl", pet_spl.toString());

    await jollyState.program.rpc.redeemPet({
      accounts: {
        authority: wallet.publicKey.toString(),
        breed: breed.publicKey.toString(),
        pet: selectedPet.publicKey.toString(),
        senderNftAccount: pet_spl.toString(),
        recieverNftAccount: wallet_nft_account.toString(),
        nft: nft.toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
        systemProgram: anchor.web3.SystemProgram.programId.toString(),
        rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString(),
      },
    });
  };

  useEffect(() => {
    // console.log("state refreshed");
    (async () => {
      if (
        !wallet ||
        !wallet.publicKey ||
        !wallet.signAllTransactions ||
        !wallet.signTransaction
      ) {
        return;
      }
      await setupJollyRanch();
    })();
  }, [wallet]);

  useEffect(() => {
    // console.log("jollyState refreshed");
    if (jollyState["program"] && wallet.publicKey) {
      (async () => {
        await getPetsLeft();
        setLoadingNfts(true);
        setLoadingBreeds(true);
        const breedsforOwner = await await jollyState.program.account.breed.all(
          [
            {
              memcmp: {
                offset: 8,
                bytes: bs58.encode(wallet.publicKey.toBuffer()),
                // bytes: bs58.encode(new Buffer(0)),
              },
            },
          ]
        );
        const parsedBreeds = [];
        const parsedRolls = [];
        breedsforOwner.map((breed) => {
          if (!breed.account.withdrawn) {
            parsedBreeds.push(breed);
          } else {
            parsedRolls.push(breed);
          }
        });
        parsedRolls.sort(function (a, b) {
          const n1 = parseInt(a.account.timestamp);
          const n2 = parseInt(b.account.timestamp);
          return n2 - n1;
        });
        const nftsForOwner = await getNftsForOwner(
          jollyState.connection,
          wallet.publicKey
        );
        // const redeemablePets = await jollyState.program.account.pet.all([
        //   {
        //     memcmp: {
        //       offset: 8 + 32 + 32 + 1, // Discriminator
        //       // bytes: bs58.encode(wallet.publicKey.toBuffer()),
        //       bytes: bs58.encode(new Buffer(0)),
        //     },
        //   },
        // ]);
        // console.log("redeemablePets", redeemablePets);
        // console.log("nftsforowner", nftsForOwner);
        setBreeds(parsedBreeds as any);
        setRolls(parsedRolls as any);
        setNfts(nftsForOwner as any);
        setLoadingNfts(false);
        setLoadingBreeds(false);
      })();
      (async () => {
        await getTotalStakedRats();
        await getStakedNfts();
      })();
    } else {
      // console.log("reset jollyState");
      setStakedMints([]);
      setStakedNFTs([]);
      setNfts([]);
    }
  }, [jollyState, refreshStateCounter]);

  useEffect(() => {
    if (stakedNFTs.length > 0) {
      setLoadingStakes(true);
      (async () => {
        await getStakedMints();
      })();
    } else {
      setLoadingStakes(false);
    }
  }, [stakedNFTs]);

  useEffect(() => {
    // console.log(tritonAmount);
    calculateCatch(tritonAmount);
  }, [tritonAmount]);

  return (
    <>
      <Head>
        <title>Pet Palace</title>
        <meta
          name="description"
          content="An nft staking platform for Sea Shanties Pets"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main
        style={{
          backgroundImage: `url(${Bg.src})`,
          backgroundAttachment: "fixed",
          objectFit: "contain",
          backgroundRepeat: "no-repeat",
          zIndex: "10",
          display: "absolute",
          backgroundSize: "cover",
        }}
        className="w-screen"
      >
        <Navigation activeId="pet-palace" />
        <div className="p-2 pt-4 md:p-8 lg:pl-[19.5rem] min-h-screen text-neutral-content bg-center">
          {/* Breeding Modal */}
          <a
            href="#breeder"
            className="btn btn-primary hidden"
            ref={breederRef}
          >
            open breeder
          </a>
          <div id="breeder" className="modal">
            <div className="modal-box bg-primary">
              <p
                className="font-[Jangkuy] text-center"
                style={{ fontSize: "1.4rem" }}
              >
                Choose Items
              </p>
              {isBreed ? (
                <div className="flex flex-wrap gap-x-14 justify-around">
                  <div className="item-container">
                    <span
                      className="label-text block font-[Jangkuy]"
                      style={{ color: "white" }}
                    >
                      Fresh Haircut
                    </span>
                    <div
                      className="card bordered bg-cover bg-center bg-[url('../items/haircut.jpg')] item-box"
                      style={{ borderColor: "#fd7cf6" }}
                    >
                      <div className="form-control h-full">
                        <label className="cursor-pointer relative label h-full checkbox-label">
                          <span
                            className="p-tag relative"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            +3%
                          </span>
                          <input
                            type="checkbox"
                            checked={tritonAmount.freshHaircut}
                            onChange={() => {}}
                            className="checkbox checkbox-primary p-tag"
                            onClick={() => {
                              setTritonAmount((tritonAmount) => ({
                                ...tritonAmount,
                                freshHaircut: !tritonAmount.freshHaircut,
                              }));
                            }}
                          />
                          <span
                            className="absolute price-tag"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            42 $TRTN
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="item-container">
                    <span
                      className="label-text block font-[Jangkuy]"
                      style={{ color: "white" }}
                    >
                      Bow Tie
                    </span>
                    <div
                      className="card bordered bg-cover bg-center bg-[url('../items/bowtie.jpg')] item-box"
                      style={{ borderColor: "#fd7cf6" }}
                    >
                      <div className="form-control h-full">
                        <label className="cursor-pointer relative label h-full checkbox-label">
                          <span
                            className="p-tag relative"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            +15%
                          </span>
                          <input
                            type="checkbox"
                            checked={tritonAmount.bowTie}
                            onChange={() => {}}
                            className="checkbox checkbox-primary p-tag"
                            onClick={() => {
                              setTritonAmount((tritonAmount) => ({
                                ...tritonAmount,
                                bowTie: !tritonAmount.bowTie,
                              }));
                            }}
                          />
                          <span
                            className="absolute price-tag"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            210 $TRTN
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="item-container">
                    <span
                      className="label-text block font-[Jangkuy]"
                      style={{ color: "white" }}
                    >
                      Jewelry
                    </span>
                    <div
                      className="card bordered bg-cover bg-center bg-[url('../items/jewel.jpg')] item-box"
                      style={{ borderColor: "#fd7cf6" }}
                    >
                      <div className="form-control h-full">
                        <label className="cursor-pointer relative label h-full checkbox-label">
                          <span
                            className="p-tag relative"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            +20%
                          </span>
                          <input
                            type="checkbox"
                            checked={tritonAmount.jewelry}
                            onChange={() => {}}
                            className="checkbox checkbox-primary p-tag"
                            onClick={() => {
                              setTritonAmount((tritonAmount) => ({
                                ...tritonAmount,
                                jewelry: !tritonAmount.jewelry,
                              }));
                            }}
                          />
                          <span
                            className="absolute price-tag"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            270 $TRTN
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="item-container">
                    <span
                      className="label-text block font-[Jangkuy]"
                      style={{ color: "white" }}
                    >
                      King's Crown
                    </span>
                    <div
                      className="card bordered bg-cover bg-center bg-[url('../items/crown.jpg')] item-box"
                      style={{ borderColor: "#fd7cf6" }}
                    >
                      <div className="form-control h-full">
                        <label className="cursor-pointer relative label h-full checkbox-label">
                          <span
                            className="p-tag relative"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            +50%
                          </span>
                          <input
                            type="checkbox"
                            checked={tritonAmount.kingsCrown}
                            onChange={() => {}}
                            className="checkbox checkbox-primary p-tag"
                            onClick={() => {
                              setTritonAmount((tritonAmount) => ({
                                ...tritonAmount,
                                kingsCrown: !tritonAmount.kingsCrown,
                              }));
                            }}
                          />
                          <span
                            className="absolute price-tag"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            1000 $TRTN
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap space-x-4">
                  <div className="item-container">
                    <span
                      className="label-text block font-[Jangkuy]"
                      style={{ color: "white" }}
                    >
                      Bait
                    </span>
                    <div
                      className="card bordered bg-cover bg-center bg-[url('../items/bait.jpg')] item-box"
                      style={{ borderColor: "#fd7cf6" }}
                    >
                      <div className="form-control h-full">
                        <label className="cursor-pointer relative label h-full checkbox-label">
                          <span
                            className="p-tag relative"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            +15%
                          </span>
                          <input
                            type="checkbox"
                            checked={tritonAmount.bait}
                            onChange={() => {}}
                            className="checkbox checkbox-primary relative p-tag"
                            onClick={() => {
                              setTritonAmount((tritonAmount) => ({
                                ...tritonAmount,
                                bait: !tritonAmount.bait,
                              }));
                              // console.log(tritonAmount);
                              calculateCatch(tritonAmount);
                            }}
                          />
                          <span
                            className="absolute price-tag"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            225 $TRTN
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="item-container">
                    <span
                      className="label-text block font-[Jangkuy]"
                      style={{ color: "white" }}
                    >
                      Hook
                    </span>
                    <div
                      className="card bordered bg-cover bg-center bg-[url('../items/hook.jpg')] item-box"
                      style={{ borderColor: "#fd7cf6" }}
                    >
                      <div className="form-control h-full">
                        <label className="cursor-pointer relative label h-full checkbox-label">
                          <span
                            className="p-tag relative"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            +20%
                          </span>
                          <input
                            type="checkbox"
                            checked={tritonAmount.hook}
                            onChange={() => {}}
                            className="checkbox checkbox-primary relative p-tag"
                            onClick={() => {
                              setTritonAmount((tritonAmount) => ({
                                ...tritonAmount,
                                hook: !tritonAmount.hook,
                              }));
                              // console.log(tritonAmount);
                              calculateCatch(tritonAmount);
                            }}
                          />
                          <span
                            className="absolute price-tag"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            300 $TRTN
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="item-container">
                    <span
                      className="label-text block font-[Jangkuy]"
                      style={{ color: "white" }}
                    >
                      Poseidon Whistle
                    </span>
                    <div
                      className="card bordered bg-cover bg-center bg-[url('../items/pw.jpg')] item-box"
                      style={{ borderColor: "#fd7cf6" }}
                    >
                      <div className="form-control h-full">
                        <label className="cursor-pointer relative label h-full checkbox-label">
                          <span
                            className="p-tag relative"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            +50%
                          </span>
                          <input
                            type="checkbox"
                            checked={tritonAmount.poseidonWhistle}
                            onChange={() => {}}
                            className="checkbox checkbox-primary relative p-tag"
                            onClick={() => {
                              setTritonAmount((tritonAmount) => ({
                                ...tritonAmount,
                                poseidonWhistle: !tritonAmount.poseidonWhistle,
                              }));
                              // console.log(tritonAmount);
                              calculateCatch(tritonAmount);
                            }}
                          />
                          <span
                            className="absolute price-tag"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            1000 $TRTN
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <span
                className="mt-4 block font-[Jangkuy]"
                style={{ color: "white" }}
              >
                Probability of success: {successCatch}%
              </span>
              <div className="stat-desc max-w-[100%]">
                <progress
                  value={successCatch}
                  max="100"
                  className="progress progress-black"
                ></progress>
              </div>

              <span
                className="mt-4 block font-[Jangkuy]"
                style={{ color: "white" }}
              >
                Total: <span className="underline">{catchTotal} $TRTN</span>
              </span>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href="#"
                  style={{ fontFamily: "Montserrat" }}
                  className="btn mt-6"
                  ref={modalRef}
                >
                  cancel
                </a>
                {isBreed ? (
                  <a
                    href="#"
                    style={{ fontFamily: "Montserrat" }}
                    className="btn mt-6"
                    ref={modalRef}
                    onClick={async () => {
                      setTritonAmount((tritonAmount) => ({
                        ...tritonAmount,
                        breed: !tritonAmount.breed,
                      }));
                      await tamePet(breedStake);
                      await refresh();
                    }}
                  >
                    Breed
                  </a>
                ) : (
                  <a
                    href="#"
                    style={{ fontFamily: "Montserrat" }}
                    className="btn mt-6"
                    ref={modalRef}
                    onClick={async () => {
                      await tamePet();
                      await refresh();
                    }}
                  >
                    Catch
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Loading Modal */}
          <a href="#loader" className="btn btn-primary hidden" ref={loaderRef}>
            open loader
          </a>
          <div id="loader" className="modal">
            <div className="modal-box stat">
              <div className="stat-figure text-primary">
                <button className="btn loading btn-circle btn-lg bg-base-content btn-ghost"></button>
              </div>
              <p style={{ fontFamily: "Montserrat", color: "white" }}>
                Loading...
              </p>
              <div className="stat-desc max-w-[90%]">
                <progress
                  value={loader}
                  max="5000"
                  className="progress progress-accent"
                  style={{ backgroundColor: "white", color: "#541ff1" }}
                ></progress>
              </div>
              <a
                href="#"
                style={{ fontFamily: "Montserrat" }}
                className="btn hidden"
                ref={modalRef}
              >
                Close
              </a>
            </div>
          </div>
          <Header activeId="pet-palace" />
          <div className="text-center col-span-1">
            <div className="grid-cols-3">
              {/* Navbar Section */}
              <div className="navbar mb-8 shadow-[10px_1px_15px_0px_#000000] text-neutral-content rounded-box bg-[#264880]">
                <div className=" px-2 mx-2 navbar-start sm:flex btn-group">
                  {/* <div className="flex items-stretch">
                    {wallet.publicKey && (
                      <div className="w-full mt-2 border stats border-base-100 m-2.5">
                        <div className="stat bg-base-100">
                          <div className="stat-value text-white">
                            {totalRatsStaked.toLocaleString("en-US")}/1000
                          </div>
                          <div
                            className="stat-title text-white"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            Pets Staked
                          </div>
                        </div>
                      </div>
                    )}
                  </div> */}
                  {petsLeft.length > 0 && (
                    <button
                      className="btn btn-outline btn-secondary font-jangkuy"
                      onClick={() => {
                        setTritonAmount((tritonAmount) => ({
                          ...tritonAmount,
                          breed: false,
                        }));
                        setTritonAmount((tritonAmount) => ({
                          ...tritonAmount,
                          tame: true,
                        }));
                        setIsBreed(false);
                        breederRef.current.click();
                      }}
                    >
                      <span className="text-accent-content">
                        CATCH<br />
                        A PET
                      </span>
                    </button>
                  )}

                      <a
                          className="btn btn-outline btn-secondary font-jangkuy"
                          href="https://lp.shill-city.com/#" target="_blank"
                      >
                      <span className="text-accent-content">
                        Buy<br />
                        $TRTN
                      </span>
                      </a>
                </div>
                <div className="navbar-end">
                  {wallet.connected && (
                      <label
                          className="mr-4"
                          style={{ fontFamily: "Jangkuy", color: "#FFFFFF" }}
                      >Pets left: {petsLeft.length}</label>
                  )}
                    <div
                        className="btn btn-primary z-50"
                        style={{ color: "#fff" }}
                    >
                        <WalletMultiButton
                        style={{
                            all: "unset",
                            height: "100%",
                            width: "100%",
                            zIndex: "10",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontFamily: "Montserrat",
                            fontSize: "0.8rem",
                        }}
                        />
                    </div>
                </div>
              </div>
              <div className="border mockup-window border-base-200 mb-8">
                {/* begin app windows */}
                <div className="flex justify-center px-2 py-4 border-t border-base-200">
                  {loadingStakes && wallet.connected && (
                    <h1
                      className="text-lg font-400 animate-pulse"
                      style={{
                        fontFamily: "Scratchy",
                        fontSize: "2.5rem",
                        color: "#D5D3D2",
                      }}
                    >
                      Loading your Staked NFT&apos;s, please wait...
                    </h1>
                  )}
                  {!wallet.connected && (
                    <p
                      style={{
                        fontFamily: "Scratchy",
                        fontSize: "2.5rem",
                        color: "#D5D3D2",
                      }}
                    >
                      Please connect your wallet above
                    </p>
                  )}
                  {stakedMints.length > 0 && !loadingStakes && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {stakedMints.map((nft, i) => {
                        // console.log("mint nft", nft);
                        return (
                          <NFTLoader
                            key={i}
                            isStaked={true}
                            nft={nft}
                            stakingRewards={stakingRewards}
                            petsLeft={petsLeft}
                            onRedeem={async () => {
                              await redeemRewards(nft.nft_account.publicKey);
                              await refresh();
                            }}
                            unStake={async () => {
                              await redeemNFT(
                                nft.nft_account.publicKey,
                                nft.nft_account.account.mints
                              );
                              await refresh();
                            }}
                            onBreed={async () => {
                              setIsBreed(true);
                              setBreedStake(nft);
                              setTritonAmount((tritonAmount) => ({
                                ...tritonAmount,
                                breed: true,
                              }));
                              setTritonAmount((tritonAmount) => ({
                                ...tritonAmount,
                                tame: false,
                              }));
                              breederRef.current.click();
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                  {stakedMints.length == 0 &&
                    !loadingStakes &&
                    wallet.publicKey && (
                      <p
                        className="text-lg font-400"
                        style={{
                          fontFamily: "Scratchy",
                          fontSize: "2.5rem",
                          color: "#D5D3D2",
                        }}
                      >
                        You don't have any Pets staked
                      </p>
                    )}
                </div>
              </div>

              {/* Pet Trainer */}

              <div className="border mockup-window border-base-200 mb-8">
                {/* begin app windows */}
                <div className="absolute top-0 right-0 w-36 flex items-center mt-2">
                  <p>My Rolls</p>
                  <input
                    type="checkbox"
                    checked={isRolls}
                    onChange={() => {}}
                    className="toggle toggle-lg ml-2 bg-[#541FF2] checked:bg-[#51DBF6] checked:border-[#51DBF6]"
                    onClick={() => {
                      setIsRolls((isRolls) => !isRolls);
                    }}
                  />
                </div>
                <div className="flex justify-center px-2 py-4 border-t border-base-200">
                  {loadingBreeds && wallet.connected && (
                    <h1
                      className="text-lg font-400 animate-pulse"
                      style={{
                        fontFamily: "Scratchy",
                        fontSize: "2.5rem",
                        color: "#D5D3D2",
                      }}
                    >
                      Loading your Breeding NFT&apos;s, please wait...
                    </h1>
                  )}
                  {!wallet.connected && (
                    <p
                      style={{
                        fontFamily: "Scratchy",
                        fontSize: "2.5rem",
                        color: "#D5D3D2",
                      }}
                    >
                      Please connect your wallet above
                    </p>
                  )}
                  {!loadingBreeds && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {!isRolls ? (
                        <>
                          {breeds.map((breed, i) => {
                            // console.log("breed", breed);
                            // console.log(breed.account.items);
                            return (
                              <div
                                key={
                                  breed.account.id.toString() || Math.random()
                                }
                                className="card w-72 m-4 card-bordered card-compact shadow-2xl bg-primary-content text"
                              >
                                {/* <figure>
                              <img
                                src={`${breed.image}`}
                                alt="sea shanties breed image"
                              />
                            </figure> */}
                                <div className="card-body text-center items-center">
                                  <h2
                                    className="card-title"
                                    style={{
                                      fontFamily: "Jangkuy",
                                      fontSize: ".75rem",
                                    }}
                                  >
                                    Pet Roll Number:{" "}
                                    {breed.account.id.toString()}
                                  </h2>
                                  <div className="flex">
                                    {Object.keys(breed.account.items).map(
                                      (key) => {
                                        if (breed.account.items[key]) {
                                          return (
                                            <p
                                              key={key}
                                              className="m-1 badge badge-outline bg-ghost badge-sm text-white"
                                              style={{
                                                fontFamily: "Montserrat",
                                                fontSize: "10px",
                                              }}
                                            >
                                              {key}
                                            </p>
                                          );
                                        }
                                      }
                                    )}
                                  </div>
                                  {breed.account.result > 0 ? (
                                    <button
                                      className="btn btn-secondary"
                                      onClick={async () => {
                                        await redeemPet(breed);
                                        await refresh();
                                      }}
                                    >
                                      <p>Roll For Pet</p>
                                    </button>
                                  ) : (
                                    <button
                                      disabled={true}
                                      className="btn"
                                      style={{
                                        backgroundColor: "gray",
                                        color: "#bfc0c6",
                                      }}
                                    >
                                      <p>Wen Pet?</p>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <>
                          {rolls.map((breed, i) => {
                            console.log(rolls);
                            breed = breed.account;
                            let won = false;
                            if (
                              parseInt(breed.chance.toString()) >=
                              parseInt(breed.result.toString())
                            ) {
                              won = true;
                            }
                            const a = breed.id
                              .add(breed.timestamp)
                              .add(breed.seed);
                            const b = a
                              .mod(new BN(100))
                              .add(new BN(1))
                              .toString();

                            return (
                              <div
                                key={breed.id.toString() || Math.random()}
                                className="card w-72 m-4 card-bordered card-compact shadow-2xl bg-primary-content text"
                              >
                                <div className="card-body text-center items-center">
                                  <p>Pet Roll Id: {breed.id.toString()}</p>
                                  <p>
                                    Roll Timestamp: {breed.timestamp.toString()}
                                  </p>
                                  <p>Roll Seed: {breed.seed.toString()}</p>
                                  <p>Roll Chance: {breed.chance.toString()}</p>
                                  <p>Roll Result: {breed.result.toString()}</p>
                                  {won ? (
                                    <p>Congratulations, you won a pet!</p>
                                  ) : (
                                    <p>You didn't win a pet. TRY AGAIN!</p>
                                  )}
                                  {/*<p>
                                    VRF: ((id + timestamp + seed) % 100) +1: {b}
                                  </p>*/}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                  {breeds.length == 0 && !loadingBreeds && wallet.publicKey && (
                    <p
                      className="text-lg font-400"
                      style={{
                        fontFamily: "Scratchy",
                        fontSize: "2.5rem",
                        color: "#D5D3D2",
                      }}
                    >
                      You don't have any Pets breeding or taming
                    </p>
                  )}
                </div>
              </div>

              {/* Wallet nfts */}

              <div className="border mockup-window border-base-200 mb-8">
                {nftStakeArray.length > 0 ? (
                  <div className="absolute top-0 right-0 w-full -mx-24">
                    <div className="grid grid-cols-1">
                      <button
                        className="btn btn-primary"
                        onClick={async () => {
                          await stakeNFT(nftStakeArray);
                          await refresh();
                        }}
                      >
                        <p className="mr-16" style={{ color: "white" }}>
                          Submit {nftStakeArray.length} Pet(s) For Staking
                        </p>
                      </button>
                    </div>
                  </div>
                ) : (
                  <></>
                )}
                <div className="flex justify-center px-2 py-4 border-t border-base-200">
                  <div>
                    {loadingNfts && wallet.connected && (
                      <h1
                        className="text-lg font-bold animate-pulse"
                        style={{
                          fontFamily: "Scratchy",
                          fontSize: "2.5rem",
                          color: "#D5D3D2",
                        }}
                      >
                        Loading your NFT&apos;s, please wait...
                      </h1>
                    )}
                    {!wallet.connected && (
                      <p
                        style={{
                          fontFamily: "Scratchy",
                          fontSize: "2.5rem",
                          color: "#D5D3D2",
                        }}
                      >
                        Please connect your wallet above
                      </p>
                    )}
                    {!loadingNfts && wallet.connected && nfts.length === 0 && (
                      <h1
                        className="text-lg font-400"
                        style={{
                          fontFamily: "Scratchy",
                          fontSize: "2.5rem",
                          color: "#D5D3D2",
                        }}
                      >
                        You don't have any Pets in your wallet
                      </h1>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {nfts.map((nft) => {
                      return (
                        <NFTLoader
                          key={nft.id}
                          isStaked={false}
                          nft={nft}
                          nftStakeArray={nftStakeArray}
                          onStake={async () => {
                            setNftStakeArray((nftStakeArray) => [
                              ...nftStakeArray,
                              nft,
                            ]);
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              {/* end app windows */}
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;
