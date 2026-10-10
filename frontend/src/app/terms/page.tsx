"use client";

import { useI18n } from "@/i18n/provider";
import {
  FileText,
  AlertTriangle,
  ShieldCheck,
  Scale,
  RefreshCw,
  Mail,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";

export default function TermsPage() {
  const { t } = useI18n();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileText
            size={32}
            style={{ color: "var(--color-green-700)" }}
            className="shrink-0"
          />
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: "var(--color-brown-900)" }}
          >
            {t("terms.title")}
          </h1>
        </div>
        <p className="text-base font-medium text-stone-600">
          {t("terms.effective_date")}
        </p>
      </div>

      {/* Main content container */}
      <div
        className="p-6 sm:p-8 rounded-xl space-y-8 bg-white border border-stone-200"
        style={{
          boxShadow: "var(--shadow-sm)",
        }}
      >
        {/* Intro */}
        <p className="text-base text-stone-800 leading-relaxed">
          {t("terms.intro")}
        </p>

        {/* Section 1: Informational Advice Only */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <HelpCircle size={22} style={{ color: "var(--color-green-700)" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("terms.section_informational_title")}
            </h2>
          </div>
          <div
            className="p-4 rounded-lg text-base text-stone-800 leading-relaxed"
            style={{
              backgroundColor: "var(--color-cream-dark)",
              border: "1px solid var(--color-brown-300)",
            }}
          >
            {t("terms.section_informational_desc")}
          </div>
        </section>

        {/* Section 2: Limitation of Liability */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <AlertTriangle size={22} className="text-amber-700" />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("terms.section_liability_title")}
            </h2>
          </div>
          <p className="text-base text-stone-800 leading-relaxed">
            {t("terms.section_liability_desc")}
          </p>
        </section>

        {/* Section 3: No Chemical Dosage Advice */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <ShieldAlert size={22} className="text-red-700" />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("terms.section_chemicals_title")}
            </h2>
          </div>
          <p className="text-base text-stone-800 leading-relaxed">
            {t("terms.section_chemicals_desc")}
          </p>
        </section>

        {/* Section 4: Acceptable Use */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <ShieldCheck size={22} style={{ color: "var(--color-green-700)" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("terms.section_acceptable_title")}
            </h2>
          </div>
          <p className="text-base text-stone-800 leading-relaxed">
            {t("terms.section_acceptable_desc")}
          </p>
        </section>

        {/* Section 5: Third-Party Data Sources */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <RefreshCw size={22} style={{ color: "var(--color-green-700)" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("terms.section_thirdparty_title")}
            </h2>
          </div>
          <p className="text-base text-stone-800 leading-relaxed">
            {t("terms.section_thirdparty_desc")}
          </p>
        </section>

        {/* Section 6: Governing Law */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <Scale size={22} style={{ color: "var(--color-green-700)" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("terms.section_governing_title")}
            </h2>
          </div>
          <p className="text-base text-stone-800 leading-relaxed">
            {t("terms.section_governing_desc")}
          </p>
        </section>

        {/* Section 7: Changes to Terms */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <RefreshCw size={22} style={{ color: "var(--color-green-700)" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("terms.section_changes_title")}
            </h2>
          </div>
          <p className="text-base text-stone-800 leading-relaxed">
            {t("terms.section_changes_desc")}
          </p>
        </section>

        {/* Section 8: Contact */}
        <section className="space-y-3 pt-6 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <Mail size={22} style={{ color: "var(--color-green-700)" }} />
            <h2
              className="text-xl font-bold"
              style={{ color: "var(--color-brown-900)" }}
            >
              {t("terms.section_contact_title")}
            </h2>
          </div>
          <p className="text-base text-stone-800 leading-relaxed">
            {t("terms.section_contact_desc")}
          </p>
        </section>
      </div>
    </div>
  );
}
