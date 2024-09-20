"use client";

import { useState } from "react";
import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";
import type { ISuccessResult } from "@worldcoin/idkit";
import axios from "axios";

export default function Home() {
  const [isVerified, setIsVerified] = useState(false);
  const [worldId, setWorldId] = useState("");

  const verifyProof = async (proof: ISuccessResult) => {
    console.log("Proof received:", proof);
    try {
      const response = await axios.post("https://inspector-proxy.replit.app/worldId", proof);
      console.log("Proof verification response:", response);
      setWorldId(response.data.nullifier_hash);
      setIsVerified(true);
    } catch (error) {
      console.error("Error verifying proof:", error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Welcome to PumpInspector</h1>

        {!isVerified ? (
          <IDKitWidget
            app_id="app_staging_1b80c195333c350add4fda2d1e29d3f5"
            action="verifyidentity"
            onSuccess={verifyProof}
            verification_level={VerificationLevel.Device}
          >
            {({ open }) => <button onClick={open}>Verify with World ID</button>}
          </IDKitWidget>
        ) : (
          <div>
            <p>Verified! Your World ID nullifier hash: {worldId}</p>
          </div>
        )}
      </div>
    </main>
  );
}
