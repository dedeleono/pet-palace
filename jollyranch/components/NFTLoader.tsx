import { FC } from "react";

interface NFTLoaderProps {
  nft: NFT;
  isStaked: boolean;
  onStake?: any;
  onRedeem?: any;
  unStake?: any;
  stakingRewards?: any;
}
interface NFT {
  id: number;
  attributes: any;
  image: string;
  name: string;
  mint: any;
  nft_account: any;
}

const NFTLoader: FC<NFTLoaderProps> = ({
  nft,
  isStaked,
  onStake,
  onRedeem,
  unStake,
  stakingRewards,
}) => {
  // console.log("isStaked, nft", isStaked, nft);
  if (isStaked) {
    return (
      <div
        key={nft.nft_account.id.toString() || Math.random()}
        className="card w-72 m-4 card-bordered card-compact shadow-2xl bg-primary-content text"
      >
        <figure>
          <img src={`${nft.image}`} alt="sea shanties nft image" />
        </figure>
        <div className="card-body text-center items-center">
          <h2
            className="card-title"
            style={{ fontFamily: "Jangkuy", fontSize: "1.2rem" }}
          >
            {nft.name}
          </h2>
          <p style={{ fontFamily: "Montserrat", fontSize: "14px" }}>Started</p>
          <p
            className="badge badge-outline bg-ghost badge-sm text-white"
            style={{ fontFamily: "Montserrat", fontSize: "10px" }}
          >
            {new Date(
              nft.nft_account.account.startDate * 1000
            ).toLocaleDateString("en-US", {
              weekday: "short", // long, short, narrow
              day: "numeric", // numeric, 2-digit
              year: "numeric", // numeric, 2-digit
              month: "short", // numeric, 2-digit, long, short, narrow
              hour: "numeric", // numeric, 2-digit
              minute: "numeric", // numeric, 2-digit
            })}
          </p>
          <p className="mb-3"></p>
          <div className="">
            <p style={{ fontFamily: "Montserrat" }}>Estimate Rewards</p>
            <p
              className="badge badge-outline badge-sm text-xs font-bold"
              style={{ fontFamily: "Montserrat", color: "#f7752f" }}
            >
              {stakingRewards[nft.nft_account.id.toString()] > -1
                ? stakingRewards[nft.nft_account.id.toString()] + " $TRTN"
                : "Loading..."}
            </p>
          </div>
          <div className="justify-center card-actions">
            <button
              style={{
                fontFamily: "Scratchy",
                fontSize: "1.3rem",
                color: "#ffffff",
                borderColor: "#3DB489",
              }}
              className="btn btn-secondary badge-outline"
              onClick={onRedeem}
            >
              redeem
            </button>
            <button
              className="btn btn-ghost"
              onClick={unStake}
              style={{ fontFamily: "Scratchy", fontSize: "1.3rem" }}
            >
              unstake
            </button>
          </div>
        </div>
      </div>
    );
  } else {
    // console.log("nft", nft);
    return (
      <div
        key={nft.id.toString() || Math.random()}
        className="card w-72 m-4 card-bordered card-compact lg:card-normal shadow-2xl bg-primary-content text"
      >
        <figure>
          <img src={`${nft.image}`} alt="sea shainties nft image" />
        </figure>
        <div className="card-body">
          <h2
            className="card-title"
            style={{ fontFamily: "Jangkuy", fontSize: "1.2rem" }}
          >
            {nft.name}
          </h2>
          <button
            className="btn btn-secondary badge-outline mt-4"
            onClick={onStake}
            style={{
              fontFamily: "Scratchy",
              fontSize: "1.3rem",
              color: "#ffffff",
              borderColor: "#3DB489",
            }}
          >
            Stake
          </button>
        </div>
      </div>
    );
  }
};

export default NFTLoader;
