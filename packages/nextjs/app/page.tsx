"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Address } from "viem";
import { useAccount } from "wagmi";
import ReviewPage from "~~/components/inspectorAiComponents/ReviewPage";
import { AddressInput } from "~~/components/scaffold-eth";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

// Expected URL structure: /?address=0x1234...5678&chain=ethereum
// Example: http://localhost:3000/?address=0x1234567890123456789012345678901234567890&chain=ethereum

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inputAddress, setInputAddress] = useState<Address>();

  console.log("page: Home component rendered, isConnected:", isConnected);

  const address = searchParams.get("address");
  const chain = searchParams.get("chain") || "ethereum";

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputAddress) {
      router.push(`/?address=${inputAddress}&chain=${chain}`);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      {isConnected ? (
        address ? (
          <ReviewPage address={address} chain={chain} />
        ) : (
          <div className="text-center w-full max-w-2xl">
            <h1 className="text-4xl font-bold mb-8">Review a Contract</h1>
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <AddressInput
                value={inputAddress || ""}
                onChange={value => setInputAddress(value as Address)}
                placeholder="Enter contract address to review"
              />
              <button type="submit" className="btn btn-primary">
                Review Contract
              </button>
            </form>
          </div>
        )
      ) : (
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Welcome to Inspector AI</h1>
          <p className="mb-4">Please connect your wallet to continue.</p>
          <RainbowKitCustomConnectButton />
        </div>
      )}
    </main>
  );
}
