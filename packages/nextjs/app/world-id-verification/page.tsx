"use client";

import { useRouter } from "next/navigation";
import { IDKitWidget, VerificationLevel } from "@worldcoin/idkit";
import type { ISuccessResult } from "@worldcoin/idkit";
import axios from "axios";

export default function WorldIDVerification() {
  const router = useRouter();

  const verifyProof = async (proof: ISuccessResult) => {
    console.log("Proof received:", proof);
    try {
      const response = await axios.post("https://inspector-proxy.replit.app/worldId", proof);
      console.log("Proof verification response:", response);
      router.push("/review-submission");
    } catch (error) {
      console.error("Error verifying proof:", error);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Verify with World ID</h2>
          <p>Prove your humanity to submit reviews</p>
          <div className="card-actions justify-end">
            <IDKitWidget
              app_id="app_staging_1b80c195333c350add4fda2d1e29d3f5"
              action="verifyidentity"
              onSuccess={verifyProof}
              verification_level={VerificationLevel.Device}
            >
              {({ open }) => (
                <button className="btn btn-primary" onClick={open}>
                  Verify with World ID
                </button>
              )}
            </IDKitWidget>
          </div>
        </div>
      </div>
    </main>
  );
}
