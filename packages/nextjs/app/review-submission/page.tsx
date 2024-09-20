"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { EvmChains, SignProtocolClient, SpMode } from "@ethsign/sp-sdk";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export default function ReviewSubmission() {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Remove the unused state
  const { writeContractAsync } = useScaffoldWriteContract({
    contractName: "InspectorAI",
    functionName: "addReview",
  } as any); // Note: Use type assertions cautiously

  const createAttestation = async () => {
    // Implement attestation logic here
    // const client = new SignProtocolClient(SpMode.OnChain, {
    //   chain: EvmChains.polygonMumbai,
    // });
    // await client.createAttestation({
    //   schemaId: "0x...", // Replace with your schema ID
    //   data: {
    //     reviewer: contractAddress,
    //     badge: "First Comment",
    //   },
    // });
  };

  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await writeContractAsync({
        address: contractAddress, // Add this line
        args: [rating, comment],
      });
      await createAttestation();
      notification.success("Review submitted successfully!");
      router.push("/success");
    } catch (error) {
      console.error("Error submitting review:", error);
      notification.error("Failed to submit review. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Submit Your Review</h2>
          <p>Rate and comment on the token contract</p>
          <div className="rating rating-lg">
            {[1, 2, 3, 4, 5].map(star => (
              <input
                key={star}
                type="radio"
                name="rating-8"
                className="mask mask-star-2 bg-orange-400"
                checked={star === rating}
                onChange={() => setRating(star)}
              />
            ))}
          </div>
          <textarea
            className="textarea textarea-bordered"
            placeholder="Write your review here..."
            value={comment}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
          ></textarea>
          <div className="card-actions justify-end">
            <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
