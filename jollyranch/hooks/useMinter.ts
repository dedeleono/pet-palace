import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

import {
  mintOneToken,
  awaitTransactionSignatureConfirmation,
} from "../lib/mint-one-token";
import useCandyMachine from "./useCandyMachine";

const useMinter = () => {
  const wallet = useWallet();
  const { connection } = useConnection();
  // const { candyMachine } = useCandyMachine();

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [logs, setLogs] = useState([]);

  const [isCompleted, setIsCompleted] = useState(false);

  const [transactionStatus, setTransactionStatus] = useState(false);
  const [ctime, setCtime] = useState("");

  useEffect(() => {
    if (status) {
      setLogs((previous) => previous.concat(status));
    }
  }, [status, setLogs]);

  const mint = async (tokens_to_mint) => {
    setIsLoading(true);
    setLogs([]);
    let successMint = 0;

    try {
      // setStatus("Checking wallet balance...");
      // const mintPrice =
      //   candyMachine?.data?.price?.toNumber() / LAMPORTS_PER_SOL;
      // const walletBalance =
      //   (await connection.getBalance(wallet.publicKey)) / LAMPORTS_PER_SOL;

      // if (walletBalance < mintPrice)
      //   throw new Error("Insufficient balance on wallet " + wallet.publicKey)
      // console.log("candymachine", candyMachine);

      setStatus(
        `NFT transaction machine booting up ${tokens_to_mint} tx(s)...`
      );
      const results = await mintOneToken(wallet, tokens_to_mint, setStatus);
      if (!results) {
        setStatus(`Sold out during your mint but minted as many as possible.`);
        setIsLoading(false);
        setTransactionStatus(true);
        return true;
      }

      for (let i = 0; i < results.length; i++) {
        try {
          const result = results[i];
          const status = await awaitTransactionSignatureConfirmation(
            result,
            60000,
            connection
          );
          if (!status.err) {
            successMint++;
            setStatus(
              `Successfully minted ${successMint}/${tokens_to_mint} requested tokens`
            );
          }
        } catch (err) {
          let error = err.toString();
          console.log("custom error", err);
          if (error.includes("134")) {
            setStatus(`SOLD OUT OF NFTS`);
            return true;
          }
        }
      }

      setStatus(
        `Minting Complete! Minted ${successMint}/${tokens_to_mint} tokens.`
      );
      setIsLoading(false);

      setTransactionStatus(true);
      return true;
    } catch (error) {
      setStatus(error + "");
      console.log(error);
    }

    setStatus(
      `Ran out of sol... Minted ${successMint}/${tokens_to_mint} tokens`
    );
    setIsLoading(false);
  };

  const updateStatus = async () => {
    setIsCompleted(true);
  };

  return {
    isLoading,
    status,
    transactionStatus,
    logs,
    mint,
    ctime,
    isCompleted,
    updateStatus,
  };
};

export default useMinter;
