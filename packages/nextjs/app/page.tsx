"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ReviewPage from "~~/components/inspectorAiComponents/ReviewPage";

function SearchParamsWrapper() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address") || "";
  const chain = searchParams.get("chain") || "ethereum";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <ReviewPage address={address} chain={chain} />{" "}
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsWrapper />
    </Suspense>
  );
}
