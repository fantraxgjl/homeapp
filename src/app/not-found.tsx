import Link from "next/link";

export default function NotFound() {
  return (
    <div className="h-full bg-slate-900 text-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">🏠</span>
        <h1 className="text-2xl font-bold">Page not found</h1>
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium transition-colors"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
