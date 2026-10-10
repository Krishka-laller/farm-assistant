"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { LANGUAGES, ACTIVE_LANGUAGES } from "@/i18n/config";
import type { LanguageCode } from "@/i18n/config";
import { Sprout, Globe, CloudSun, TrendingUp, ScanLine, FlaskConical, MessageSquare } from "lucide-react";

export function Header() {
  const { lang, setLang, t } = useI18n();
  const pathname = usePathname();

  const navItems = [
    { href: "/", labelKey: "nav.home", icon: MessageSquare },
    { href: "/weather", labelKey: "nav.weather", icon: CloudSun },
    { href: "/mandi", labelKey: "nav.mandi", icon: TrendingUp },
    { href: "/disease", labelKey: "nav.disease", icon: ScanLine },
    { href: "/crop", labelKey: "nav.crop", icon: Sprout },
    { href: "/fertilizer", labelKey: "nav.fertilizer", icon: FlaskConical },
  ];

  return (
    <header
      style={{
        backgroundColor: "var(--color-green-900)",
        color: "var(--color-text-on-dark)",
        borderBottom: "1px solid var(--color-green-700)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand / Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-white rounded"
          style={{ minHeight: "44px" }}
        >
          <div
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ backgroundColor: "var(--color-green-700)", border: "1px solid var(--color-yellow-500)" }}
          >
            <Sprout size={20} strokeWidth={2} style={{ color: "var(--color-yellow-500)" }} />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">{t("app.name")}</span>
        </Link>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
          {navItems.map(({ href, labelKey, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-2 text-sm sm:text-base font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white"
                style={{
                  minHeight: "44px",
                  backgroundColor: isActive ? "var(--color-green-700)" : "transparent",
                  color: "var(--color-white)",
                  borderBottom: isActive ? "2px solid var(--color-yellow-500)" : "2px solid transparent",
                }}
              >
                <Icon size={18} strokeWidth={1.75} style={{ color: isActive ? "var(--color-yellow-500)" : "var(--color-green-100)" }} />
                <span>{t(labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        {/* Language Switcher */}
        <div className="flex items-center gap-2">
          <label htmlFor="header-language-select" className="sr-only">
            Select Language
          </label>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded" style={{ backgroundColor: "var(--color-green-700)", border: "1px solid var(--color-green-500)" }}>
            <Globe size={18} strokeWidth={1.75} style={{ color: "var(--color-yellow-500)" }} />
            <select
              id="header-language-select"
              value={lang}
              onChange={(e) => setLang(e.target.value as LanguageCode)}
              aria-label="Language"
              className="bg-transparent text-white font-medium outline-none cursor-pointer"
              style={{
                fontSize: "15px",
                minHeight: "36px",
              }}
            >
              {ACTIVE_LANGUAGES.map((code) => (
                <option key={code} value={code} style={{ backgroundColor: "#1a3a2a", color: "#ffffff" }}>
                  {LANGUAGES[code].name} ({LANGUAGES[code].nameEn})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
