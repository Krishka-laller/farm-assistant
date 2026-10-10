"use client";

import { useState } from "react";
import { useI18n } from "@/i18n/provider";
import { api, parseApiError } from "@/lib/api";
import type { components } from "@/lib/api-client/schema";
import {
  FlaskConical,
  AlertCircle,
  Loader2,
  Clock,
  ShieldAlert,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

type FertilizerGuideResponse = components["schemas"]["FertilizerGuideResponse"];
type SoilType = components["schemas"]["SoilType"];

const SOIL_TYPES: SoilType[] = [
  "alluvial",
  "black_cotton",
  "red",
  "laterite",
  "sandy",
  "clayey",
  "loamy",
  "saline",
];

const MAX_CHARS = 1000;

export default function FertilizerPage() {
  const { lang, t } = useI18n();

  // Form fields
  const [cropName, setCropName] = useState<string>("");
  const [soilType, setSoilType] = useState<SoilType | "">("");
  const [issueDescription, setIssueDescription] = useState<string>("");

  // Validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Request & Response state
  const [loading, setLoading] = useState<boolean>(false);
  const [slowNetwork, setSlowNetwork] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FertilizerGuideResponse | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Field validation
    const errors: Record<string, string> = {};
    if (!cropName.trim()) {
      errors.crop = t("fertilizer.error_crop_req");
    }
    if (!issueDescription.trim()) {
      errors.issue = t("fertilizer.error_issue_req");
    } else if (issueDescription.trim().length > MAX_CHARS) {
      errors.issue = t("fertilizer.error_issue_len");
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setError(null);
    setLoading(true);
    setSlowNetwork(false);
    setResult(null);
    setSubmitted(true);

    const slowTimer = setTimeout(() => {
      setSlowNetwork(true);
    }, 8000);

    try {
      const { data, error: apiErr } = await api.POST("/api/fertilizer/guide", {
        body: {
          crop_name: cropName.trim(),
          soil_type: soilType ? (soilType as SoilType) : null,
          issue_description: issueDescription.trim(),
          lang: lang,
        },
      });

      if (apiErr) {
        setError(parseApiError(apiErr).message);
      } else if (data) {
        setResult(data);
      }
    } catch (err: unknown) {
      setError(parseApiError(err).message);
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setSlowNetwork(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FlaskConical className="w-7 h-7 text-emerald-700" aria-hidden="true" />
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: "var(--color-brown-900)" }}
          >
            {t("fertilizer.title")}
          </h1>
        </div>
        <p className="text-base text-stone-600">
          {t("fertilizer.subtitle")}
        </p>
      </div>

      {/* Mandatory Safety Notice: Always visible as required */}
      <div className="bg-amber-50 border-l-4 border-amber-600 p-4 rounded-r-lg mb-6 shadow-2xs">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-base font-semibold text-amber-950 mb-1">
              {t("fertilizer.mandatory_note")}
            </p>
            <p className="text-base text-amber-900">
              {t("fertilizer.kvk_referral")}
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-xs mb-8"
      >
        <div className="space-y-5">
          {/* Crop Name */}
          <div>
            <label
              htmlFor="fert-crop-name"
              className="block text-base font-semibold text-stone-900 mb-1.5"
            >
              {t("fertilizer.crop")} <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              id="fert-crop-name"
              value={cropName}
              onChange={(e) => {
                setCropName(e.target.value);
                setFieldErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.crop;
                  return copy;
                });
              }}
              disabled={loading}
              placeholder={t("fertilizer.crop_placeholder")}
              className="w-full text-base px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-colors duration-150"
            />
            {fieldErrors.crop && (
              <p className="text-base text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{fieldErrors.crop}</span>
              </p>
            )}
          </div>

          {/* Optional Soil Type */}
          <div>
            <label
              htmlFor="fert-soil-type"
              className="block text-base font-semibold text-stone-900 mb-1.5 flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-emerald-700" aria-hidden="true" />
              <span>{t("fertilizer.soil_type")}</span>
            </label>
            <select
              id="fert-soil-type"
              value={soilType}
              onChange={(e) => setSoilType(e.target.value as SoilType | "")}
              disabled={loading}
              className="w-full text-base px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-colors duration-150"
            >
              <option value="">{t("fertilizer.soil_select_placeholder")}</option>
              {SOIL_TYPES.map((st) => (
                <option key={st} value={st}>
                  {t(`crop.soil.${st}`)}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Description (Textarea max 1000 with counter) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="fert-issue-desc"
                className="text-base font-semibold text-stone-900"
              >
                {t("fertilizer.issue")} <span className="text-red-600">*</span>
              </label>
              <span
                className={`text-base ${
                  issueDescription.length > MAX_CHARS
                    ? "text-red-600 font-bold"
                    : "text-stone-500"
                }`}
              >
                {issueDescription.length} / {MAX_CHARS} {t("fertilizer.char_counter")}
              </span>
            </div>
            <textarea
              id="fert-issue-desc"
              rows={4}
              maxLength={MAX_CHARS}
              value={issueDescription}
              onChange={(e) => {
                setIssueDescription(e.target.value);
                setFieldErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.issue;
                  return copy;
                });
              }}
              disabled={loading}
              placeholder={t("fertilizer.issue_placeholder")}
              className="w-full text-base px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 min-h-[110px] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-colors duration-150"
            />
            {fieldErrors.issue && (
              <p className="text-base text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{fieldErrors.issue}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="fertilizer-submit-btn"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg min-h-[44px] transition-colors duration-150 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  <span>{t("fertilizer.loading")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                  <span>{t("fertilizer.get_guide")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Slow Network Notice */}
      {loading && slowNetwork && (
        <div
          role="status"
          aria-live="polite"
          className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3"
        >
          <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-base">{t("fertilizer.slow_network")}</p>
        </div>
      )}

      {/* API Error State */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mb-6 p-4 rounded-lg bg-red-50 border border-red-300 text-red-900 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-base">
            <p className="font-semibold mb-1">{t("common.error")}</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* General Advice */}
          {result.general_advice && (
            <div className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-6 h-6 text-emerald-700 shrink-0" aria-hidden="true" />
                <h2 className="text-xl font-bold text-stone-900">
                  {t("fertilizer.general_advice")}
                </h2>
              </div>
              <p className="text-base text-stone-800 leading-relaxed">
                {result.general_advice}
              </p>
            </div>
          )}

          {/* Recommendations List */}
          {result.recommendations && result.recommendations.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-stone-900">
                {t("fertilizer.recommendations")}
              </h2>
              {result.recommendations.map((item, idx) => (
                <div
                  key={`${item.guidance_type}-${idx}`}
                  className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
                    <h3 className="text-lg font-bold text-stone-900">
                      {item.guidance_type}
                    </h3>
                  </div>

                  {item.general_advice && (
                    <p className="text-base text-stone-700 leading-relaxed">
                      {item.general_advice}
                    </p>
                  )}

                  {/* Application Timing */}
                  {item.application_timing && (
                    <div className="bg-stone-50 rounded-lg p-3 border border-stone-200 flex items-start gap-2.5">
                      <Clock className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <p className="text-base font-semibold text-stone-900">
                          {t("fertilizer.application_timing")}
                        </p>
                        <p className="text-base text-stone-700">{item.application_timing}</p>
                      </div>
                    </div>
                  )}

                  {/* Safety Practices */}
                  {item.safety_practices && item.safety_practices.length > 0 && (
                    <div className="pt-2 border-t border-stone-100">
                      <p className="text-base font-semibold text-stone-900 mb-2">
                        {t("fertilizer.safety_practices")}
                      </p>
                      <ul className="space-y-1.5">
                        {item.safety_practices.map((practice, pIdx) => (
                          <li
                            key={pIdx}
                            className="flex items-start gap-2 text-base text-stone-700"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1" aria-hidden="true" />
                            <span>{practice}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : !result.general_advice ? (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
              <FlaskConical className="w-12 h-12 text-stone-400 mx-auto mb-3" aria-hidden="true" />
              <h2 className="text-lg font-bold text-stone-900 mb-1">
                {t("fertilizer.empty_title")}
              </h2>
              <p className="text-base text-stone-600">
                {t("fertilizer.empty_desc")}
              </p>
            </div>
          ) : null}

          {/* Official API Disclaimer */}
          {result.disclaimer && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-base text-amber-900">{result.disclaimer}</p>
            </div>
          )}
        </div>
      )}

      {/* Initial state before submit */}
      {!result && !loading && !error && !submitted && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center">
          <FlaskConical className="w-12 h-12 text-stone-400 mx-auto mb-3" aria-hidden="true" />
          <p className="text-base text-stone-600">
            {t("fertilizer.subtitle")}
          </p>
        </div>
      )}
    </div>
  );
}
