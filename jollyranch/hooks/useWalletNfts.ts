import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { web3 } from "@project-serum/anchor";
import { getNftsForOwner } from "../lib/mint-one-token";

let rpcHost = "";
if (process.env.NEXT_PUBLIC_SELECTED_ENDPOINT == "quicknode-devnet") {
  rpcHost = process.env.NEXT_PUBLIC_QUICKNODE_DEVNET_RPC_ENDPOINT;
} else if (
  process.env.NEXT_PUBLIC_SELECTED_ENDPOINT == "quicknode-mainnet-beta"
) {
  rpcHost = JSON.parse(
    process.env.NEXT_PUBLIC_QUICKNODE_MAINNET_BETA_RPC_ENDPOINT
  );
  rpcHost = rpcHost[Math.floor(Math.random() * rpcHost.length)];
} else if (process.env.NEXT_PUBLIC_SELECTED_ENDPOINT == "solana-devnet") {
  rpcHost = process.env.NEXT_PUBLIC_SOLANA_DEVNET_RPC_ENDPOINT;
}

const connection = new web3.Connection(rpcHost);

const useWalletNfts = (refresh) => {
  console.log("useWalletNfts ran");
  const wallet = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const [nfts, setNfts] = useState<Array<any>>([]);

  useEffect(() => {
    (async () => {
      if (
        !wallet ||
        !wallet.publicKey ||
        !wallet.signAllTransactions ||
        !wallet.signTransaction
      ) {
        return;
      }

      setIsLoading(true);

      const nftsForOwner = await getNftsForOwner(connection, wallet.publicKey);

      setNfts(nftsForOwner as any);
      setIsLoading(false);
    })();
  }, [wallet, refresh]);

  return [isLoading, nfts];
};

export default useWalletNfts;
