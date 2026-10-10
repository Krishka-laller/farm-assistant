"use client";

import Link from "next/link";
import { Shield, FileText } from "lucide-react";
import { useI18n } from "@/i18n/provider";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer
      style={{
        backgroundColor: "var(--color-green-900)",
        color: "var(--color-cream)",
        borderTop: "1px solid var(--color-green-700)",
      }}
      className="mt-auto py-6"
    >
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <p className="text-base text-stone-300">
          {t("footer.tagline")}
        </p>

        <div className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="flex items-center gap-1.5 text-base text-stone-200 hover:text-white transition-colors duration-150"
            style={{ minHeight: "44px" }}
          >
            <Shield size={18} style={{ color: "var(--color-yellow-500)" }} />
            <span>{t("footer.privacy")}</span>
          </Link>

          <Link
            href="/terms"
            className="flex items-center gap-1.5 text-base text-stone-200 hover:text-white transition-colors duration-150"
            style={{ minHeight: "44px" }}
          >
            <FileText size={18} style={{ color: "var(--color-yellow-500)" }} />
            <span>{t("footer.terms")}</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
