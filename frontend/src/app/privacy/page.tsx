"use client";

import { useI18n } from "@/i18n/provider";
import {
  Shield,
  FileText,
  Database,
  ExternalLink,
  HardDrive,
  Mail,
  CheckCircle2,
} from "lucide-react";

export default function PrivacyPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield
            size={32}
            style={{ color: "var(--color-green-700)" }}
            className="shrink-0"
          />
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: "var(--color-brown-900)" }}
          >
            {t("privacy.title")}
          </h1>
        </div>
        <p className="text-base font-medium text-stone-600">
          {t("privacy.effective_date")}
        </p>
      </div>

      {/* Main card */}
      <div
        className="p-6 sm:p-8 rounded-xl space-y-8 bg-white border border-stone-200"
        style={{
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Intro */}
        <p className="text-base text-stone-800 leading-relaxed">
          {t("privacy.intro")}
        </p>

        {/* Section 1: What we process */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <FileText size={22} style={{ color: "var(--color-green-700)" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("privacy.section_process_title")}
            </h2>
          </div>
          <p className="text-base text-stone-700 leading-relaxed">
            {t("privacy.section_process_desc")}
          </p>
          <ul className="space-y-2.5 text-base text-stone-800 pl-1">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-700 mt-1 shrink-0" />
              <span>{t("privacy.process_chat")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-700 mt-1 shrink-0" />
              <span>{t("privacy.process_photos")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-700 mt-1 shrink-0" />
              <span>{t("privacy.process_location")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-700 mt-1 shrink-0" />
              <span>{t("privacy.process_lang")}</span>
            </li>
          </ul>
        </section>

        {/* Section 2: Why we process */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <Shield size={22} style={{ color: "var(--color-green-700)" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("privacy.section_why_title")}
            </h2>
          </div>
          <p className="text-base text-stone-800 leading-relaxed">
            {t("privacy.section_why_desc")}
          </p>
        </section>

        {/* Section 3: Storage and retention */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <Database size={22} style={{ color: "var(--color-green-700)" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("privacy.section_storage_title")}
            </h2>
          </div>
          <div
            className="p-4 rounded-lg text-base text-stone-800 leading-relaxed"
            style={{
              backgroundColor: "var(--color-cream-dark)",
              border: "1px solid var(--color-brown-300)",
            }}
          >
            {t("privacy.section_storage_desc")}
          </div>
        </section>

        {/* Section 4: Third-party services */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <ExternalLink size={22} style={{ color: "var(--color-green-700)" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("privacy.section_thirdparty_title")}
            </h2>
          </div>
          <p className="text-base text-stone-700 leading-relaxed">
            {t("privacy.section_thirdparty_desc")}
          </p>
          <ul className="space-y-2.5 text-base text-stone-800 pl-1">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-700 mt-1 shrink-0" />
              <span>{t("privacy.thirdparty_gemini")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-700 mt-1 shrink-0" />
              <span>{t("privacy.thirdparty_weather")}</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={18} className="text-emerald-700 mt-1 shrink-0" />
              <span>{t("privacy.thirdparty_mandi")}</span>
            </li>
          </ul>
        </section>

        {/* Section 5: Browser storage */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <HardDrive size={22} style={{ color: "var(--color-green-700)" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("privacy.section_browser_title")}
            </h2>
          </div>
          <p className="text-base text-stone-800 leading-relaxed">
            {t("privacy.section_browser_desc")}
          </p>
        </section>

        {/* Section 6: User rights & contact */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <Mail size={22} style={{ color: "var(--color-green-700)" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("privacy.section_rights_title")}
            </h2>
          </div>
          <p className="text-base text-stone-800 leading-relaxed">
            {t("privacy.section_rights_desc")}
          </p>
          <div
            className="p-4 rounded-lg font-mono text-sm sm:text-base text-stone-900"
            style={{
              backgroundColor: "var(--color-cream)",
              border: "1px solid var(--color-brown-300)",
            }}
          >
            {t("privacy.contact_info")}
          </div>
        </section>
      </div>
    </div>
  );
}
