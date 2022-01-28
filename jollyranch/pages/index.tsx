import * as anchor from "@project-serum/anchor";
import { Program, Provider, BN } from "@project-serum/anchor";
import { ConfirmOptions } from "@solana/web3.js";
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
import idl_type from "../lib/nft_staker.json";
import { getNftsForOwner } from "../lib/mint-one-token";
import { programs } from "@metaplex/js";
import NFTLoader from "../components/NFTLoader";
import { url } from "inspector";
import Bg from "../public/images/out.png";
import { readBuilderProgram } from "typescript";

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
  const [stakedNFTs, setStakedNFTs] = useState([]);
  const [stakedMints, setStakedMints] = useState([]);
  const [nfts, setNfts] = useState([]);
  const [loadingNfts, setLoadingNfts] = useState(true);
  const [loadingStakes, setLoadingStakes] = useState(true);
  const [stakingRewards, setStakingRewards] = useState({});
  const [refreshStateCounter, setRefreshStateCounter] = useState(0);
  const [totalRatsStaked, setTotaRatsStaked] = useState(0);

  const loaderRef = useRef(null);
  const modalRef = useRef(null);
  const [loader, setLoader] = useState(0);

  const txTimeout = 10000;

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

  const stakeNFT = async (publicKey) => {
    const nft = new anchor.web3.PublicKey(publicKey);
    // console.log("nft", nft.toString());
    // console.log("cheese", cheese);
    // console.log("lockup", lockup);
    const stake = anchor.web3.Keypair.generate();
    let [stake_spl, stakeBump] = await anchor.web3.PublicKey.findProgramAddress(
      [stake.publicKey.toBuffer()],
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
    const largestAccounts = await jollyState.connection.getTokenLargestAccounts(
      nft
    );
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

    // console.log("wallet_nft_account", wallet_nft_account.toString());
    await jollyState.program.rpc.stakeNft(stakeBump, {
      accounts: {
        authority: wallet.publicKey.toString(),
        stake: stake.publicKey.toString(),
        senderSplAccount: wallet_nft_account.toString(),
        recieverSplAccount: stake_spl.toString(),
        mint: nft.toString(),
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
    const shillCityCapital = new anchor.web3.PublicKey(
      "AH8QQSG2frNPYo9Ckqo9jzrPUixCQGJgL2jsApS3Kvkx"
    );
    // console.log("shillCityCapital", shillCityCapital);
    // console.log("shillCityCapital", shillCityCapital.toString());
    const program = new Program(idl, shillCityCapital.toString(), provider);
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
            [nft_account.publicKey.toBuffer()],
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
          "9Gd3CpPFgK5PbfRnEuhF2JmDSUFEyWkHPkB7GA4SfSdA",
          "APA8t9faSRNdZvB1opJvB5DQ8h3aeCFyNxZiaCMSArTZ",
          "FrLGhta8fHTcyFTqiTDUwiDiG59L5xnvnqJwS2ssVXu7",
          "662zoahSfHgZYjQ9bzcS8MzqRfsF2H1h549uZUebC4e6",
          "Fs9SpcHN8J7PN8gjmp7Xvhae8EA4Zwifa79eNCQHJNgW",
          "4j99GW37LGL1Er7otAsqRdWgNDt9srZguim9n4rFCoDj",
        ];
        let redemption_rate = 6.9;
        // console.log("nft", nft.nft_account.account.mint.toString());
        if (mints.includes(nft.nft_account.account.mint.toString())) {
          redemption_rate = 16.9;
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

  const redeemNFT = async (stakePubKey, nftPubKey) => {
    console.log("stakesPubKey", stakePubKey.toString());
    console.log("nftPubKey", nftPubKey.toString());
    let wallet_nft_account = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      nftPubKey,
      jollyState.program.provider.wallet.publicKey
    );
    console.log("wallet_nft_account", wallet_nft_account.toString());
    let [stake_spl, _stakeBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [stakePubKey.toBuffer()],
        jollyState.program.programId
      );

    console.log("stake_spl", stake_spl.toString());

    await jollyState.program.rpc.redeemNft({
      accounts: {
        stake: stakePubKey.toString(),
        jollyranch: jollyState.jollyranch.toString(),
        authority: jollyState.program.provider.wallet.publicKey.toString(),
        senderSplAccount: stake_spl.toString(),
        recieverSplAccount: wallet_nft_account.toString(),
        senderTritonAccount: jollyState.recieverSplAccount.toString(),
        recieverTritonAccount: jollyState.wallet_token_account.toString(),
        mint: jollyState.spl_token.toString(),
        nft: nftPubKey.toString(),
        systemProgram: anchor.web3.SystemProgram.programId.toString(),
        tokenProgram: TOKEN_PROGRAM_ID.toString(),
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
        rent: anchor.web3.SYSVAR_RENT_PUBKEY.toString(),
      },
    });
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
        setLoadingNfts(true);
        const nftsForOwner = await getNftsForOwner(
          jollyState.connection,
          wallet.publicKey
        );
        // console.log("nftsforowner", nftsForOwner);
        setNfts(nftsForOwner as any);
        setLoadingNfts(false);
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

  return (
    <>
      <Head>
        <title>Shill City Capital</title>
        <meta
          name="description"
          content="An nft staking platform for Sea Shanties"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <div
          style={{
            backgroundImage: `url(${Bg.src})`,
            objectFit: "contain",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
            zIndex: "10",
          }}
          className="grid grid-cols-1 min-h-screen bg-neutral-focus text-neutral-content p-16 bg-center"
        >
          {/* Loading Modal */}
          <a href="#loader" className="btn btn-primary hidden" ref={loaderRef}>
            open loader
          </a>
          <div id="loader" className="modal">
            <div className="modal-box stat">
              <div className="stat-figure text-primary">
                <button className="btn loading btn-circle btn-lg bg-base-200 btn-ghost"></button>
              </div>
              <p style={{ fontFamily: "Montserrat" }}>Loading...</p>
              <div className="stat-desc max-w-[90%]">
                <progress
                  value={loader}
                  max="5000"
                  className="progress progress-black"
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
          <div className="text-center col-span-1">
            <div className="grid-cols-3">
              {/* Navbar Section */}
              <div className="navbar mb-8 shadow-lg bg-neutral text-neutral-content rounded-box">
                <div className="px-2 mx-2 navbar-start">
                  <span
                    className="text-lg font-bold"
                    style={{ fontFamily: "Jangkuy" }}
                  >
                    Shill City Capital
                  </span>
                </div>
                <div className="hidden px-2 mx-2 navbar-center sm:flex">
                  <div className="flex items-stretch">
                    {wallet.publicKey && (
                      <div className="w-full mt-2 border stats border-base-100 m-2.5">
                        <div className="stat bg-base-100">
                          <div className="stat-value text-white">
                            {totalRatsStaked.toLocaleString("en-US")}/3,333
                          </div>
                          <div
                            className="stat-title text-white"
                            style={{ fontFamily: "Montserrat" }}
                          >
                            Shanties Staked
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="navbar-end">
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
                            onRedeem={async () => {
                              await redeemRewards(nft.nft_account.publicKey);
                              await refresh();
                            }}
                            unStake={async () => {
                              await redeemNFT(
                                nft.nft_account.publicKey,
                                nft.nft_account.account.mint
                              );
                              await refresh();
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
                        You don't have any shanties staked
                      </p>
                    )}
                </div>
              </div>

              <div className="border mockup-window border-base-200 mb-8">
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
                        You don't have any shanties in your wallet
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
                          onStake={async () => {
                            // console.log(
                            //   "mint, cheese, lockup: ",
                            //   nft.mint,
                            //   cheese,
                            //   lockup
                            // );
                            await stakeNFT(nft.mint);
                            await refresh();
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
