"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useI18n } from "@/i18n/provider";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    // Log non-sensitive error structure for local diagnosis
    console.error("App Error caught by boundary:", error.message);
  }, [error]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div
        className="p-8 sm:p-12 rounded-xl bg-white border border-stone-200 space-y-5"
        style={{
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-red-50 text-red-600"
        >
          <AlertCircle size={36} />
        </div>

        <h1
          className="text-2xl sm:text-3xl font-bold tracking-tight"
          style={{ color: "var(--color-brown-900)" }}
        >
          {t("error_page.title")}
        </h1>

        <p className="text-base text-stone-700 max-w-md mx-auto leading-relaxed">
          {t("error_page.description")}
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto px-6 py-3 rounded text-base font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 min-h-[44px]"
            style={{
              backgroundColor: "var(--color-green-700)",
              color: "var(--color-white)",
              border: "1px solid var(--color-green-900)",
            }}
          >
            <RefreshCw size={18} />
            <span>{t("error_page.retry")}</span>
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded text-base font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 min-h-[44px] border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800"
          >
            <Home size={18} />
            <span>{t("error_page.back_home")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
