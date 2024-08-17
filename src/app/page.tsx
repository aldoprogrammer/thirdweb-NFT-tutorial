'use client';
import Image from "next/image";
import { ConnectButton, MediaRenderer, TransactionButton, useActiveAccount, useReadContract } from "thirdweb/react";
import thirdwebIcon from "@public/thirdweb.svg";
import { client } from "./client";
import { defineChain, getContract, toEther } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import { getContractMetadata } from "thirdweb/extensions/common";
import { claimTo, getActiveClaimCondition, getTotalClaimedSupply, nextTokenIdToMint } from "thirdweb/extensions/erc721";
import { useState } from "react";

export default function Home() {
  const chain = defineChain(sepolia)

  const account = useActiveAccount();

  const [quantity, setQuantity] = useState(1)

  const contractAddress: string = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

  if (!contractAddress) {
    throw new Error("Contract address is not defined.");
  }
  
  const contract = getContract({
    client: client,
    chain: chain,
    address: contractAddress, // Now TypeScript knows this is a string
  });
  

  const { data: contractMetadata, isLoading: isContractMetadataLoading } = useReadContract(getContractMetadata,
    { contract: contract }
  )

  const { data: claimedSupply, isLoading: isClaimedSupplyLoading } = useReadContract(getTotalClaimedSupply,
    { contract: contract }
  )

  const { data: totalNFTSupply, isLoading: isTotalSupply } = useReadContract(nextTokenIdToMint,
    { contract: contract }
  )

  const { data: claimCondition } = useReadContract(getActiveClaimCondition,
    { contract: contract }
  )

  const getPrice = (quantity: number) => {
    const total = quantity * parseInt(claimCondition?.pricePerToken.toString() || "0")
    return toEther(BigInt(total));
  }

  return (
    <main className="p-4 pb-10 min-h-[100vh] flex items-center justify-center container max-w-screen-lg mx-auto">
      <div className="py-20">
        <Header />
        <ConnectButton
          client={client}
          chain={chain}
        />
        <div className="flex flex-col items-center mt-4">
          {isContractMetadataLoading ? (
            <div className="text-zinc-500">Loading contract metadata...</div>
          ) : (
            <div className="text-center">
              <MediaRenderer
                client={client}
                src={contractMetadata?.image}
                className="rounded-xl"
              />
              <h2 className="text-2xl md:text-4xl font-semibold md:font-bold tracking-tighter mb-6">
                {contractMetadata?.name}
              </h2>
              <p className="text-zinc-500">{contractMetadata?.description}</p>

              {isClaimedSupplyLoading || isTotalSupply ? (
                <div className="text-zinc-500">Loading...</div>
              ) : (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold md:font-bold tracking-tighter mb-2">
                    Total NFT supply:
                  </h3>
                  <p className="text-zinc-500">
                    {claimedSupply?.toString()} / {totalNFTSupply?.toString()}
                  </p>
                </div>)}
                <div className="flex flex-row items-center justify-center my-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >-</button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value))} name="" id=""
                    className="border-2 border-zinc-500 text-center m-2 bg-black w-10 rounded-md overflow-hidden"
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                  >+</button>
                </div>
                <TransactionButton
                  transaction={() => claimTo({
                    contract: contract,
                    to: account?.address || "",
                    quantity: BigInt(quantity),
                  })}
                  onTransactionConfirmed={async () => {
                    alert("NFT Claimed!")
                    setQuantity(1)
                  }}
                >
                  {`Claim NFT (${getPrice(quantity)} ETH)`}
                </TransactionButton>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Header() {
  return (
    <header className="flex flex-col items-center mb-20 md:mb-20">
      <Image
        src={thirdwebIcon}
        alt=""
        className="size-[150px] md:size-[150px]"
        style={{
          filter: "drop-shadow(0px 0px 24px #a726a9a8)",
        }}
      />

      <h1 className="text-2xl md:text-6xl font-semibold md:font-bold tracking-tighter mb-6 text-zinc-100">
        Claim NFT
      </h1>
    </header>
  );
}

