import { useCallback, useState } from "react";
import { useScaffoldReadContract } from "./useScaffoldReadContract";
import { useScaffoldWriteContract } from "./useScaffoldWriteContract";
import confetti from "canvas-confetti";
import { notification } from "~~/utils/scaffold-eth";

export const useInspectorAI = (contractAddress: string) => {
  const [reviews, setReviews] = useState<any[]>([]);

  console.log("[useInspectorAI] Initializing hook with contractAddress:", contractAddress);

  const { data: fetchedReviews, refetch: refetchReviews } = useScaffoldReadContract({
    contractName: "InspectorAI",
    functionName: "getReviews",
    args: [contractAddress],
  });

  console.log("[useInspectorAI] fetchedReviews:", fetchedReviews);

  const { writeContract: addReviewAsync, isMining: isAddingReview } = useScaffoldWriteContract("InspectorAI");

  const addReview = useCallback(
    async (rating: number, comment: string) => {
      console.log("[useInspectorAI] addReview called with rating:", rating, "comment:", comment);
      try {
        console.log("[useInspectorAI] Calling addReview function");
        await addReviewAsync({
          functionName: "addReview",
          args: [contractAddress, BigInt(rating) as any, comment],
        });

        console.log("[useInspectorAI] Transaction sent");

        // The transaction is already confirmed by the time we reach here
        console.log("[useInspectorAI] Transaction confirmed");

        notification.success("Review added successfully!");
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
        await refetchReviews();
      } catch (error) {
        console.error("[useInspectorAI] Error adding review:", error);
        notification.error("Failed to add review");
      }
    },
    [addReviewAsync, contractAddress, refetchReviews],
  );

  const loadReviews = useCallback(async () => {
    console.log("[useInspectorAI] loadReviews called");
    try {
      await refetchReviews();
      if (fetchedReviews) {
        console.log("[useInspectorAI] Fetched reviews:", fetchedReviews);
        setReviews(fetchedReviews as any[]);
      }
    } catch (error) {
      console.error("[useInspectorAI] Error loading reviews:", error);
      notification.error("Failed to load reviews");
    }
  }, [refetchReviews, fetchedReviews]);

  console.log("[useInspectorAI] Returning hook functions");
  return { addReview, loadReviews, reviews, isAddingReview };
};
