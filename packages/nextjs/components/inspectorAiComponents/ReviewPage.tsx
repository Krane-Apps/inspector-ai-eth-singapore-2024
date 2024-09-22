"use client";

import { useEffect, useState } from "react";
import { EvmChains, SignProtocolClient, SpMode } from "@ethsign/sp-sdk";
import { IDKitWidget, ISuccessResult, VerificationLevel } from "@worldcoin/idkit";
import { useWalletClient } from "wagmi";
import { useInspectorAI } from "~~/hooks/scaffold-eth/useInspectorAI";

interface ReviewPageProps {
  address: string;
  chain: string;
}

interface Attestation {
  id: string;
  attester: string;
  attestTimestamp: string;
  data: {
    contractAddress?: string;
    chainId?: number;
    rating?: number;
    review?: string;
    timestamp?: number;
  };
}

export default function ReviewPage({ address, chain }: ReviewPageProps) {
  console.log("ReviewPage: Rendering with props:", { address, chain });

  const [isVerified, setIsVerified] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const { addReview, loadReviews, reviews, isAddingReview } = useInspectorAI(address);
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [attestations, setAttestations] = useState<Attestation[]>([]);

  console.log("ReviewPage: Hook values:", { reviews, isAddingReview });

  useEffect(() => {
    console.log("ReviewPage: useEffect - Loading reviews");
    loadReviews();
    queryAttestations();
  }, [loadReviews]);

  const handleVerification = () => {
    console.log("ReviewPage: Verification successful");
    setIsVerified(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    await createAttestation();
    return;
    e.preventDefault();
    console.log("ReviewPage: Submitting review", { rating, comment });
    await addReview(rating, comment);

    setRating(0);
    setComment("");
  };

  const queryAttestations = async () => {
    console.log("Starting queryAttestations");
    setLoading(true);
    try {
      const url = `https://testnet-rpc.sign.global/api/scan/attestations?schemaId=onchain_evm_11155111_0x271&size=100`;
      console.log("Fetching from URL:", url);
      const response = await fetch(url);
      const data = await response.json();
      console.log("Received data:", data);
      if (data.success) {
        const formattedAttestations = data.data.rows.map((row: any) => {
          let parsedData = {};
          try {
            parsedData = JSON.parse(atob(row.data.slice(2)));
          } catch (error) {
            console.error("Error parsing attestation data:", error);
          }
          return {
            id: row.id,
            attester: row.attester,
            attestTimestamp: new Date(parseInt(row.attestTimestamp) * 1000).toLocaleString(),
            data: parsedData,
          };
        });
        console.log("Formatted attestations:", formattedAttestations);
        setAttestations(formattedAttestations);
      } else {
        console.error("API request was not successful:", data.message);
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error querying attestations:", error);
      alert("Failed to query attestations. Check console for details.");
    } finally {
      setLoading(false);
      console.log("queryAttestations completed");
    }
  };

  const createAttestation = async () => {
    if (!walletClient) {
      console.error("Wallet client not available");
      return;
    }

    setLoading(true);
    try {
      const client = new SignProtocolClient(SpMode.OnChain, {
        chain: EvmChains.sepolia,
        walletClient: walletClient,
      });

      console.log("ReviewPage: Creating attestation", {
        schemaId: "0x271",
        data: {
          contractAddress: address,
          chainId: parseInt(chain),
          rating: rating,
          review: comment,
          timestamp: Math.floor(Date.now() / 1000),
        },
        indexingValue: address.toLowerCase(),
      });
      const attestationResult = await client.createAttestation({
        schemaId: "0x271",
        data: {
          contractAddress: address,
          chainId: parseInt(chain),
          rating: rating,
          review: comment,
          timestamp: Math.floor(Date.now() / 1000),
        },
        indexingValue: address.toLowerCase(),
      });

      console.log("ReviewPage: Attestation created", attestationResult);
      alert(`Review attestation created successfully! ID: ${attestationResult.attestationId}`);
      await queryAttestations();
    } catch (error) {
      console.error("ReviewPage: Error creating attestation", error);
      alert("Failed to create attestation. Check console for details.");
    } finally {
      setLoading(false);
    }
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
                  isAddingReview || loading || rating === 0 || comment.trim() === "" ? "bg-gray-600" : ""
                }`}
                disabled={isAddingReview || loading || rating === 0 || comment.trim() === ""}
              >
                {isAddingReview || loading ? "Submitting..." : "Submit Review"}
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

      {attestations.length > 0 && (
        <div className="mt-8">
          <h3 className="text-2xl font-bold mb-4 text-textDark">Attestations</h3>
          <ul className="space-y-4">
            {attestations.map(attestation => (
              <li key={attestation.id} className="bg-primary p-4 rounded-lg">
                <p>
                  <strong>ID:</strong> {attestation.id}
                </p>
                <p>
                  <strong>Attester:</strong> {attestation.attester}
                </p>
                <p>
                  <strong>Timestamp:</strong> {attestation.attestTimestamp}
                </p>
                {attestation.data.contractAddress && (
                  <p>
                    <strong>Contract Address:</strong> {attestation.data.contractAddress}
                  </p>
                )}
                {attestation.data.chainId && (
                  <p>
                    <strong>Chain ID:</strong> {attestation.data.chainId}
                  </p>
                )}
                {attestation.data.rating && (
                  <p>
                    <strong>Rating:</strong> {attestation.data.rating}
                  </p>
                )}
                {attestation.data.review && (
                  <p>
                    <strong>Review:</strong> {attestation.data.review}
                  </p>
                )}
                {attestation.data.timestamp && (
                  <p>
                    <strong>Review Time:</strong> {new Date(attestation.data.timestamp * 1000).toLocaleString()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
