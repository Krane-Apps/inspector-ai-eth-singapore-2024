"use client";

import { useEffect, useState } from "react";
import { IDKitWidget, ISuccessResult, VerificationLevel } from "@worldcoin/idkit";
import { useInspectorAI } from "~~/hooks/scaffold-eth/useInspectorAI";

interface ReviewPageProps {
  address: string;
  chain: string;
}

export default function ReviewPage({ address, chain }: ReviewPageProps) {
  console.log("ReviewPage: Rendering with props:", { address, chain });

  const [isVerified, setIsVerified] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const { addReview, loadReviews, reviews, isAddingReview } = useInspectorAI(address);

  console.log("ReviewPage: Hook values:", { reviews, isAddingReview });

  useEffect(() => {
    console.log("ReviewPage: useEffect - Loading reviews");
    loadReviews();
  }, [loadReviews]);

  const handleVerification = () => {
    console.log("ReviewPage: Verification successful");
    setIsVerified(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("ReviewPage: Submitting review", { rating, comment });
    await addReview(rating, comment);
    setRating(0);
    setComment("");
  };

  const verifyProof = async (proof: ISuccessResult) => {
    console.log("ReviewPage: Proof received:", proof);
    handleVerification();
  };

  console.log("ReviewPage: Current state", { isVerified, rating, comment, reviews });

  return (
    <div className="container mx-auto p-4 bg-background text-textDark">
      <div className="card bg-primary shadow-xl max-w-md mx-auto">
        <div className="card-body bg-card rounded-md">
          <h2 className="card-title text-background">Review Contract</h2>
          <p className="text-sm opacity-70 text-background">Chain: {chain}</p>
          <p className="text-sm opacity-70 text-background">Address: {address}</p>
          <form onSubmit={handleSubmit}>
            <div className="form-control">
              <div className="rating rating-lg">
                {[1, 2, 3, 4, 5].map(star => (
                  <input
                    key={star}
                    type="radio"
                    name="rating"
                    className="mask mask-star-2 bg-warningDark"
                    checked={rating === star}
                    onChange={() => setRating(star)}
                  />
                ))}
              </div>
            </div>
            <div className="form-control mt-5">
              <textarea
                className={`textarea textarea-bordered h-24 bg-card text-black border-1 ${
                  comment ? "border-primary" : "border-gray-300"
                } rounded-md`}
                placeholder="Write your review here..."
                value={comment}
                onChange={e => setComment(e.target.value)}
              ></textarea>
            </div>
            <div className="form-control mt-4">
              <IDKitWidget
                app_id="app_staging_1b80c195333c350add4fda2d1e29d3f5"
                action="verifyidentity"
                onSuccess={verifyProof}
                verification_level={VerificationLevel.Device}
              >
                {({ open }) => (
                  <button type="button" className="btn bg-primary text-textDark" onClick={open}>
                    Verify with WorldID (Optional)
                  </button>
                )}
              </IDKitWidget>
            </div>
            <div className="form-control mt-6">
              <button
                type="submit"
                className={`btn bg-primary text-textDark hover:bg-primary-focus ${
                  isAddingReview || rating === 0 || comment.trim() === "" ? "bg-gray-600" : ""
                }`}
                disabled={isAddingReview || rating === 0 || comment.trim() === ""}
              >
                {isAddingReview ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-4 text-textDark">Reviews</h3>
        {reviews.length > 0 ? (
          <ul className="space-y-4">
            {reviews.map((review, index) => (
              <li key={index} className="bg-primary p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <div className="rating rating-sm">
                    {[1, 2, 3, 4, 5].map(star => (
                      <input
                        key={star}
                        type="radio"
                        className="mask mask-star-2 bg-warningDark"
                        checked={review.rating === star}
                        readOnly
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm opacity-70 text-textDark">by {review.reviewer}</span>
                </div>
                <p className="text-textDark">{review.comment}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-textDark">No reviews yet.</p>
        )}
      </div>
    </div>
  );
}
