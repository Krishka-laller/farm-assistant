"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useI18n } from "@/i18n/provider";
import { api } from "@/lib/api";
import { compressImage } from "@/lib/imageCompression";
import { getErrorMessage } from "@/lib/errorUtils";
import type { components } from "@/lib/api-client/schema";
import {
  Camera,
  Upload,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  FileCheck,
  ShieldCheck,
  Clock,
  Trash2,
} from "lucide-react";

type DiseaseIdentifyResponse = components["schemas"]["DiseaseIdentifyResponse"];
type ConfidenceLevel = components["schemas"]["Confidence"];

export default function DiseasePage() {
  const { lang, t } = useI18n();

  const [cropName, setCropName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [slowNetwork, setSlowNetwork] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DiseaseIdentifyResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const slowTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Revoke object URL on unmount or before creating new ones
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current);
      }
    };
  }, [previewUrl]);

  const clearSelectedPhoto = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setFile(null);
    setOriginalSize(null);
    setCompressedSize(null);
    setError(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const processSelectedFile = async (selectedFile: File) => {
    // 1. Reject non-images
    if (!selectedFile.type.startsWith("image/")) {
      setError(t("disease.invalid_file_type"));
      return;
    }

    // 2. Reject files over 5 MB
    const MAX_BYTES = 5 * 1024 * 1024;
    if (selectedFile.size > MAX_BYTES) {
      setError(t("disease.file_too_large"));
      return;
    }

    setError(null);
    setResult(null);
    setOriginalSize(selectedFile.size);

    try {
      // 3. Compress client-side: max 1280px on longest side, JPEG quality 0.8
      const compressed = await compressImage(selectedFile, 1280, 0.8);
      setFile(compressed);
      setCompressedSize(compressed.size);

      // 4. Set object URL for preview and revoke previous URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newPreview = URL.createObjectURL(compressed);
      setPreviewUrl(newPreview);
    } catch {
      setError(t("disease.compression_failed"));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processSelectedFile(selected);
    }
  };

  const handleUploadSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!file) return;

    setLoading(true);
    setSlowNetwork(false);
    setError(null);
    setResult(null);

    // Set 8-second slow network detector
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    slowTimerRef.current = setTimeout(() => {
      setSlowNetwork(true);
    }, 8000);

    const formData = new FormData();
    formData.append("image", file, file.name);
    formData.append("lang", lang);
    if (cropName.trim()) {
      formData.append("crop_name", cropName.trim());
    }

    try {
      // Generated client call
      const { data: resData, error: apiErr } = await api.POST("/api/disease/identify", {
        body: formData as unknown as { image: string; lang: components["schemas"]["LanguageCode"]; crop_name: string },
      });

      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);

      if (apiErr) {
        const parsed = getErrorMessage(apiErr, t("disease.service_unavailable"));
        setError(parsed);
      } else if (resData) {
        setResult(resData);
      }
    } catch (err: unknown) {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      const parsed = getErrorMessage(err, t("disease.service_unavailable"));
      setError(parsed);
    } finally {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(1) + " KB";
  };

  const renderConfidenceBadge = (confidence?: ConfidenceLevel | null) => {
    if (!confidence) return null;

    let badgeClass = "bg-stone-200 text-stone-800";
    let label = t("disease.confidence_low");

    if (confidence === "high") {
      badgeClass = "bg-emerald-100 text-emerald-900";
      label = t("disease.confidence_high");
    } else if (confidence === "medium") {
      badgeClass = "bg-amber-100 text-amber-900";
      label = t("disease.confidence_medium");
    }

    return (
      <span className={`text-base font-semibold px-3 py-1 rounded-full ${badgeClass}`}>
        {label}
      </span>
    );
  };

  const isUncertain = !result?.identified || result?.refer_to_expert;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: "var(--color-brown-900)" }}
        >
          {t("disease.title")}
        </h1>
        <p className="text-base text-stone-600">
          {t("disease.subtitle")}
        </p>
      </div>

      {/* Upload and input form */}
      <form
        onSubmit={handleUploadSubmit}
        className="p-4 sm:p-6 rounded-xl mb-6 space-y-5"
        style={{
          backgroundColor: "var(--color-cream-dark)",
          border: "1px solid var(--color-brown-300)",
        }}
      >
        {/* Optional Crop Name */}
        <div>
          <label className="block text-base font-semibold text-stone-800 mb-1">
            {t("disease.crop_name")}
          </label>
          <input
            type="text"
            value={cropName}
            onChange={(e) => setCropName(e.target.value)}
            placeholder={t("disease.crop_name_placeholder")}
            className="w-full px-3 py-2 rounded text-base bg-white border border-stone-300 text-stone-900 min-h-[44px]"
          />
        </div>

        {/* File and Camera inputs */}
        <div>
          <label className="block text-base font-semibold text-stone-800 mb-1">
            {t("disease.upload")} *
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />

          {!file ? (
            <div
              className="border-2 border-dashed rounded-xl p-6 text-center bg-white border-stone-300 hover:border-stone-400 transition-colors duration-150"
            >
              <Upload size={36} className="mx-auto mb-2 text-stone-500" />
              <p className="text-base font-medium text-stone-800 mb-4">
                {t("disease.click_or_tap")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded text-base font-semibold flex items-center justify-center gap-2 cursor-pointer min-h-[44px] transition-colors duration-150 border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800"
                >
                  <Upload size={18} />
                  <span>{t("disease.choose_file")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded text-base font-semibold flex items-center justify-center gap-2 cursor-pointer min-h-[44px] transition-colors duration-150 border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800"
                >
                  <Camera size={18} />
                  <span>{t("disease.take_photo")}</span>
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-3">{t("disease.upload_hint")}</p>
            </div>
          ) : (
            /* Selected Photo Preview with client-side compression metrics */
            <div className="p-4 rounded-xl bg-white border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {previewUrl && (
                <div className="relative w-28 h-28 shrink-0">
                  <Image
                    src={previewUrl}
                    alt={t("disease.preview_ready")}
                    fill
                    unoptimized
                    className="rounded-lg object-cover border border-stone-300"
                  />
                </div>
              )}
              <div className="flex-1 text-base text-stone-700">
                <div className="flex items-center gap-2 font-semibold text-emerald-900 mb-1">
                  <FileCheck size={20} />
                  <span>{t("disease.client_compressed")}</span>
                </div>
                {originalSize && compressedSize && (
                  <p className="text-base text-stone-700">
                    {t("disease.original_size")}: <strong>{formatFileSize(originalSize)}</strong> | {t("disease.optimized_size")}: <strong>{formatFileSize(compressedSize)}</strong>
                  </p>
                )}
                <p className="text-xs text-stone-500 mt-1">
                  {t("disease.privacy_note")}
                </p>
              </div>

              <div className="flex sm:flex-col gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 sm:flex-none px-3 py-2 rounded text-base font-semibold flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 transition-colors duration-150"
                >
                  <Upload size={16} />
                  <span>{t("disease.change_photo")}</span>
                </button>
                <button
                  type="button"
                  onClick={clearSelectedPhoto}
                  className="px-3 py-2 rounded text-base font-semibold flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition-colors duration-150"
                  aria-label={t("disease.remove_photo")}
                >
                  <Trash2 size={16} />
                  <span>{t("disease.remove_photo")}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!file || loading}
          className="w-full px-4 py-3 rounded text-base font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px] transition-colors duration-150"
          style={{
            backgroundColor: "var(--color-green-700)",
            color: "var(--color-white)",
            border: "1px solid var(--color-green-900)",
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              <span>{t("disease.analyzing")}</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={20} />
              <span>{t("disease.identify")}</span>
            </>
          )}
        </button>
      </form>

      {/* Loading state */}
      {loading && (
        <div
          className="p-10 rounded-xl text-center flex flex-col items-center justify-center gap-3 my-6"
          style={{
            backgroundColor: "var(--color-cream-dark)",
            border: "1px solid var(--color-brown-300)",
          }}
        >
          <RefreshCw size={32} className="animate-spin text-stone-700" />
          <p className="text-base font-bold text-stone-800">{t("disease.analyzing")}</p>

          {/* Slow network indicator after 8 seconds */}
          {slowNetwork && (
            <div className="flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-base">
              <Clock size={18} className="shrink-0" />
              <span>{t("disease.slow_network")}</span>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          className="p-5 rounded-xl my-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          style={{
            backgroundColor: "#fdf2f2",
            border: "1px solid var(--color-red-600)",
            color: "var(--color-red-600)",
          }}
        >
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-base">{t("disease.analysis_error")}</p>
              <p className="text-base mt-1 text-stone-800">{error}</p>
            </div>
          </div>
          {file && (
            <button
              type="button"
              onClick={() => handleUploadSubmit()}
              className="px-4 py-2 rounded text-base font-semibold flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[44px] transition-colors duration-150"
              style={{
                backgroundColor: "var(--color-red-600)",
                color: "var(--color-white)",
              }}
            >
              <RefreshCw size={18} />
              <span>{t("common.retry")}</span>
            </button>
          )}
        </div>
      )}

      {/* Results View */}
      {result && !loading && (
        <div className="space-y-6">
          {/* Uncertain or Refer to Expert Block */}
          {isUncertain ? (
            <div
              className="p-6 rounded-xl space-y-4"
              style={{
                backgroundColor: "var(--color-cream-dark)",
                border: "2px solid var(--color-yellow-700)",
              }}
            >
              <div className="flex items-start gap-3">
                <HelpCircle size={32} className="text-amber-800 shrink-0 mt-1" />
                <div>
                  <h2
                    className="text-xl font-bold mb-1"
                    style={{ color: "var(--color-brown-900)" }}
                  >
                    {t("disease.uncertain_heading")}
                  </h2>
                  <p className="text-base text-stone-800 leading-relaxed">
                    {result.description || t("disease.uncertain_text")}
                  </p>
                </div>
              </div>

              {/* Informational Disclaimer from API */}
              <div
                className="p-4 rounded-lg flex items-start gap-3 bg-white border border-stone-200"
              >
                <ShieldAlert size={20} className="shrink-0 mt-0.5 text-amber-800" />
                <p className="text-base text-stone-700">
                  {result.disclaimer || t("common.disclaimer")}
                </p>
              </div>
            </div>
          ) : (
            /* Confident Identification Result */
            <div
              className="p-6 rounded-xl space-y-5"
              style={{
                backgroundColor: "var(--color-cream-dark)",
                border: "1px solid var(--color-brown-300)",
              }}
            >
              {/* Header with Disease Name and Confidence badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-300 gap-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={32} style={{ color: "var(--color-green-700)" }} />
                  <h2 className="text-2xl font-bold" style={{ color: "var(--color-brown-900)" }}>
                    {result.disease_name}
                  </h2>
                </div>
                {renderConfidenceBadge(result.confidence)}
              </div>

              {/* Description */}
              {result.description && (
                <p className="text-base text-stone-800 leading-relaxed bg-white p-4 rounded-lg border border-stone-200">
                  {result.description}
                </p>
              )}

              {/* Numbered Treatment Steps with Safety Warnings */}
              {(result.treatment_steps ?? []).length > 0 && (
                <div className="p-5 rounded-xl bg-white border border-stone-200 space-y-4">
                  <h3
                    className="font-bold text-lg"
                    style={{ color: "var(--color-brown-900)" }}
                  >
                    {t("disease.treatment_steps")}
                  </h3>
                  <div className="space-y-3">
                    {(result.treatment_steps ?? []).map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg border border-stone-200 bg-stone-50 space-y-2"
                      >
                        <div className="flex items-start gap-2.5">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 text-white"
                            style={{ backgroundColor: "var(--color-green-700)" }}
                          >
                            {step.step_number || idx + 1}
                          </span>
                          <p className="text-base text-stone-900 font-medium pt-0.5">
                            {step.instruction}
                          </p>
                        </div>
                        {step.safety_warning && (
                          <div className="ml-9 p-2.5 rounded bg-amber-50 border border-amber-200 flex items-start gap-2 text-base text-amber-900">
                            <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-800" />
                            <span>
                              <strong>{t("disease.safety_warning")}:</strong> {step.safety_warning}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Prevention Tips */}
              {(result.prevention_tips ?? []).length > 0 && (
                <div className="p-5 rounded-xl bg-white border border-stone-200 space-y-3">
                  <h3
                    className="font-bold text-lg"
                    style={{ color: "var(--color-brown-900)" }}
                  >
                    {t("disease.prevention_tips")}
                  </h3>
                  <ul className="space-y-2 text-base text-stone-800">
                    {(result.prevention_tips ?? []).map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <ShieldCheck size={18} className="shrink-0 mt-1 text-emerald-800" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* No Chemical Doses Policy Note */}
              <div className="text-xs text-stone-500 italic">
                {t("disease.no_chemical_dose_note")}
              </div>

              {/* Informational Disclaimer from API */}
              <div
                className="p-4 rounded-xl flex items-start gap-3"
                style={{
                  backgroundColor: "var(--color-cream)",
                  border: "1px solid var(--color-brown-300)",
                }}
              >
                <ShieldAlert size={22} className="shrink-0 mt-0.5 text-amber-800" />
                <p className="text-base text-stone-800">
                  {result.disclaimer || t("common.disclaimer")}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
