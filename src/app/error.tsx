"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-900 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm px-6">
          <span className="text-5xl">⚠️</span>
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-slate-400 text-sm">
            An unexpected error occurred. The dashboard will try to recover.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-colors"
          >
            Reload dashboard
          </button>
        </div>
      </body>
    </html>
  );
}
