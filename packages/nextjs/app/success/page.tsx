"use client";

import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();

  const handleClose = () => {
    router.push("/");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">⭐ Success!</h2>
          <p>Your review has been submitted successfully</p>
          <div className="card-actions justify-end">
            <button className="btn btn-primary" onClick={handleClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
