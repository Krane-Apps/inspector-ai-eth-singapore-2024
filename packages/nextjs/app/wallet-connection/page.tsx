"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth/RainbowKitCustomConnectButton";

export default function WalletConnection() {
  const router = useRouter();
  const { isConnected } = useAccount();

  if (isConnected) {
    router.push("/world-id-verification");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Connect Your Wallet</h2>
          <p>Connect your wallet to start reviewing tokens</p>
          <div className="card-actions justify-end">
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </div>
    </main>
  );
}
