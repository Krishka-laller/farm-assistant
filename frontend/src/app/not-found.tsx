"use client";

import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { useI18n } from "@/i18n/provider";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div
        className="p-8 sm:p-12 rounded-xl bg-white border border-stone-200 space-y-5"
        style={{
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{
            backgroundColor: "var(--color-cream-dark)",
            color: "var(--color-green-700)",
          }}
        >
          <Compass size={36} />
        </div>

        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ color: "var(--color-brown-900)" }}
        >
          404 - {t("not_found.title")}
        </h1>

        <p className="text-base text-stone-700 max-w-md mx-auto leading-relaxed">
          {t("not_found.description")}
        </p>

        <div className="pt-2 flex justify-center">
          <Link
            href="/"
            className="px-6 py-3 rounded text-base font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors duration-150 min-h-[44px]"
            style={{
              backgroundColor: "var(--color-green-700)",
              color: "var(--color-white)",
              border: "1px solid var(--color-green-900)",
            }}
          >
            <Home size={18} />
            <span>{t("not_found.back_home")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
