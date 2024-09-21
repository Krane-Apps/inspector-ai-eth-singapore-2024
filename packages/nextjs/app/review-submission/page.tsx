"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { notification } from "~~/utils/scaffold-eth";

// import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function ReviewSubmission() {
  const router = useRouter();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");

  // const { writeAsync: sendAddReviewTx, isMining } = useScaffoldWriteContract({
  //   contractName: "InspectorAI",
  //   functionName: "addReview",
  //   args: [BigInt(rating), comment],
  // });

  const handleSubmit = async () => {
    try {
      // const tx = await sendAddReviewTx();
      // console.log("Review submitted successfully:", tx);
      notification.success("Review submitted successfully!");
      router.push("/success");
    } catch (error) {
      console.error("Error submitting review:", error);
      notification.error("Failed to submit review. Please try again.");
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
            <button className="btn btn-primary" onClick={handleSubmit} disabled={false}>
              Submit Review
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
