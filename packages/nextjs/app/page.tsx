"use client";

import { useRouter } from "next/navigation";
import { useAccount } from "wagmi";

export default function Home() {
  const router = useRouter();
  const { isConnected } = useAccount();

  if (!isConnected) {
    router.push("/wallet-connection");
  } else {
    router.push("/world-id-verification");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Welcome to PumpInspector</h1>
      <p>Loading...</p>
    </main>
  );
}
