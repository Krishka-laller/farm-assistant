"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/i18n/provider";
import { api } from "@/lib/api";
import type { components } from "@/lib/api-client/schema";
import { getErrorMessage } from "@/lib/errorUtils";
import {
  Search,
  AlertCircle,
  RefreshCw,
  Store,
  Calendar,
  MapPin,
  Tag,
} from "lucide-react";

type MandiPriceResponse = components["schemas"]["MandiPriceResponse"];
type StateInfo = components["schemas"]["StateInfo"];

export default function MandiPage() {
  const { lang, t } = useI18n();

  const [states, setStates] = useState<StateInfo[]>([]);
  const [selectedState, setSelectedState] = useState<string>("Haryana");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Kurukshetra");
  const [commodity, setCommodity] = useState<string>("Wheat");

  const [data, setData] = useState<MandiPriceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadStates() {
      try {
        const { data: stData } = await api.GET("/api/location/states");
        if (isMounted && stData && stData.length > 0) {
          setStates(stData);
          const foundState = stData.find((s) => s.name === "Haryana") || stData[0];
          setSelectedState(foundState.name);
          if (foundState.districts.includes("Kurukshetra")) {
            setSelectedDistrict("Kurukshetra");
          } else if (foundState.districts.length > 0) {
            setSelectedDistrict(foundState.districts[0]);
          }
        }
      } catch {
        // Fallback gracefully without mock data
        setError(t("mandi.errorStates"));
      }
    }
    loadStates();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchPrices = async () => {
    if (!selectedState) return;

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const { data: resData, error: apiErr } = await api.GET("/api/mandi/prices", {
        params: {
          query: {
            state: selectedState,
            district: selectedDistrict || undefined,
            commodity: commodity.trim() || undefined,
            lang: lang,
          },
        },
      });

      if (apiErr) {
        const parsedMessage = getErrorMessage(apiErr, t("mandi.unavailable"));
        setError(parsedMessage);
        setData(null);
      } else if (resData) {
        setData(resData);
      }
    } catch (err: unknown) {
      const parsedMessage = getErrorMessage(err, t("mandi.unavailable"));
      setError(parsedMessage);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPrices();
  };

  const activeDistricts =
    states.find((s) => s.name === selectedState)?.districts || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: "var(--color-brown-900)" }}
        >
          {t("mandi.title")}
        </h1>
        <p className="text-base text-stone-600">
          {t("mandi.subtitle")}
        </p>
      </div>

      {/* Filter Form */}
      <form
        onSubmit={handleSearch}
        className="p-4 sm:p-6 rounded-xl mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
        style={{
          backgroundColor: "var(--color-cream-dark)",
          border: "1px solid var(--color-brown-300)",
        }}
      >
        <div>
          <label className="block text-base font-semibold text-stone-800 mb-1">
            {t("mandi.select_state")} *
          </label>
          <select
            value={selectedState}
            onChange={(e) => {
              const newState = e.target.value;
              setSelectedState(newState);
              setSelectedDistrict("");
            }}
            className="w-full px-3 py-2 rounded text-base bg-white border border-stone-300 text-stone-900 font-medium min-h-[44px]"
          >
            {states.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-base font-semibold text-stone-800 mb-1">
            {t("mandi.select_district")}
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full px-3 py-2 rounded text-base bg-white border border-stone-300 text-stone-900 font-medium min-h-[44px]"
          >
            <option value="">{t("mandi.all_districts")}</option>
            {activeDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-base font-semibold text-stone-800 mb-1">
            {t("mandi.select_commodity")}
          </label>
          <input
            type="text"
            value={commodity}
            onChange={(e) => setCommodity(e.target.value)}
            placeholder={t("mandi.commodity_placeholder")}
            className="w-full px-3 py-2 rounded text-base bg-white border border-stone-300 text-stone-900 min-h-[44px]"
          >
          </input>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 rounded text-base font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px] transition-colors duration-150"
            style={{
              backgroundColor: "var(--color-green-700)",
              color: "var(--color-white)",
              border: "1px solid var(--color-green-900)",
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>{t("mandi.searching")}</span>
              </>
            ) : (
              <>
                <Search size={18} />
                <span>{t("mandi.search")}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && (
        <div
          className="p-12 rounded-xl text-center flex flex-col items-center justify-center gap-3 my-6"
          style={{
            backgroundColor: "var(--color-cream-dark)",
            border: "1px solid var(--color-brown-300)",
          }}
        >
          <RefreshCw size={28} className="animate-spin text-stone-700" />
          <p className="text-base font-medium text-stone-800">
            {t("common.loading")}
          </p>
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
              <p className="font-semibold text-base">{t("mandi.service_notice")}</p>
              <p className="text-base mt-1 text-stone-800">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={fetchPrices}
            className="px-4 py-2 rounded text-base font-semibold flex items-center justify-center gap-2 cursor-pointer shrink-0 min-h-[44px] transition-colors duration-150"
            style={{
              backgroundColor: "var(--color-red-600)",
              color: "var(--color-white)",
            }}
          >
            <RefreshCw size={18} />
            <span>{t("mandi.retry")}</span>
          </button>
        </div>
      )}

      {/* Initial state before first search */}
      {!hasSearched && !loading && !error && (
        <div
          className="p-12 rounded-xl text-center"
          style={{
            backgroundColor: "var(--color-cream-dark)",
            border: "1px solid var(--color-brown-300)",
          }}
        >
          <Store size={44} className="mx-auto mb-3" style={{ color: "var(--color-green-700)" }} />
          <p className="text-base font-semibold" style={{ color: "var(--color-brown-900)" }}>
            {t("mandi.initial_empty")}
          </p>
          <p className="text-base text-stone-600 mt-2">
            {t("mandi.initial_hint")}
          </p>
        </div>
      )}

      {/* Empty results state */}
      {hasSearched && !loading && !error && data && (data.records ?? []).length === 0 && (
        <div
          className="p-10 rounded-xl text-center"
          style={{
            backgroundColor: "var(--color-cream-dark)",
            border: "1px solid var(--color-brown-300)",
          }}
        >
          <Tag size={40} className="mx-auto mb-3 text-stone-500" />
          <p className="text-base font-semibold" style={{ color: "var(--color-brown-900)" }}>
            {t("mandi.no_results")}
          </p>
          <div className="text-base text-stone-600 mt-3 flex flex-wrap justify-center gap-x-6">
            <span>
              <strong>{t("common.source")}:</strong> {data.source}
            </span>
            <span>
              <strong>{t("mandi.last_updated")}:</strong>{" "}
              {new Date(data.last_updated).toLocaleString([], {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          </div>
        </div>
      )}

      {/* Populated records */}
      {data && !loading && (data.records ?? []).length > 0 && (
        <div className="space-y-4">
          {/* Metadata bar */}
          <div
            className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-base"
            style={{
              backgroundColor: "var(--color-cream-dark)",
              border: "1px solid var(--color-brown-300)",
            }}
          >
            <span className="font-semibold text-stone-800">
              {data.total_count} {t("mandi.records_found")}
            </span>
            <div className="flex flex-wrap gap-x-6 text-stone-700">
              <span>
                <strong>{t("common.source")}:</strong> {data.source}
              </span>
              <span>
                <strong>{t("mandi.last_updated")}:</strong>{" "}
                {new Date(data.last_updated).toLocaleString([], {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>

          {/* Desktop Table */}
          <div
            className="hidden md:block overflow-x-auto rounded-xl bg-white border border-stone-200"
          >
            <table className="w-full text-left border-collapse text-base">
              <thead>
                <tr
                  className="border-b border-stone-200"
                  style={{ backgroundColor: "var(--color-cream-dark)" }}
                >
                  <th className="p-3.5 font-semibold text-stone-800">{t("mandi.commodity")}</th>
                  <th className="p-3.5 font-semibold text-stone-800">{t("mandi.variety")}</th>
                  <th className="p-3.5 font-semibold text-stone-800">{t("mandi.market")}</th>
                  <th className="p-3.5 font-semibold text-stone-800 text-right">
                    {t("mandi.min_price")} ({t("mandi.per_quintal")})
                  </th>
                  <th className="p-3.5 font-semibold text-stone-800 text-right">
                    {t("mandi.max_price")} ({t("mandi.per_quintal")})
                  </th>
                  <th className="p-3.5 font-semibold text-stone-800 text-right">
                    {t("mandi.modal_price")} ({t("mandi.per_quintal")})
                  </th>
                  <th className="p-3.5 font-semibold text-stone-800">{t("mandi.arrival_date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {(data.records ?? []).map((r, i) => (
                  <tr key={i} className="hover:bg-stone-50 transition-colors duration-150">
                    <td className="p-3.5 font-semibold text-stone-900">{r.commodity}</td>
                    <td className="p-3.5 text-stone-700">{r.variety || t("mandi.general_variety")}</td>
                    <td className="p-3.5 text-stone-700">
                      <div className="font-medium text-stone-900">{r.market}</div>
                      <div className="text-xs text-stone-500">{r.district}, {r.state}</div>
                    </td>
                    <td className="p-3.5 text-stone-800 text-right font-medium">₹ {r.min_price}</td>
                    <td className="p-3.5 text-stone-800 text-right font-medium">₹ {r.max_price}</td>
                    <td
                      className="p-3.5 text-right font-bold text-lg"
                      style={{ color: "var(--color-green-700)" }}
                    >
                      ₹ {r.modal_price}
                    </td>
                    <td className="p-3.5 text-stone-700 whitespace-nowrap">{r.arrival_date || "--"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Cards */}
          <div className="md:hidden space-y-4">
            {(data.records ?? []).map((r, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-white border border-stone-200 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3
                      className="font-bold text-lg"
                      style={{ color: "var(--color-brown-900)" }}
                    >
                      {r.commodity}
                    </h3>
                    <p className="text-base text-stone-600">
                      {t("mandi.variety")}: {r.variety || t("mandi.general_variety")}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded"
                    style={{
                      backgroundColor: "var(--color-green-100)",
                      color: "var(--color-green-900)",
                    }}
                  >
                    {r.market}
                  </span>
                </div>

                <div className="text-base text-stone-600 flex items-center gap-1.5">
                  <MapPin size={16} className="text-stone-500 shrink-0" />
                  <span>
                    {r.district || "--"}, {r.state}
                  </span>
                </div>

                {r.arrival_date && (
                  <div className="text-base text-stone-600 flex items-center gap-1.5">
                    <Calendar size={16} className="text-stone-500 shrink-0" />
                    <span>
                      {t("mandi.arrival_date")}: {r.arrival_date}
                    </span>
                  </div>
                )}

                {/* Prices grid */}
                <div
                  className="grid grid-cols-3 gap-2 p-3 rounded-lg text-center"
                  style={{ backgroundColor: "var(--color-cream)" }}
                >
                  <div>
                    <span className="text-xs text-stone-500 block">
                      {t("mandi.min_price")}
                    </span>
                    <span className="font-semibold text-base text-stone-900">
                      ₹ {r.min_price}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-stone-500 block">
                      {t("mandi.modal_price")}
                    </span>
                    <span
                      className="font-bold text-lg"
                      style={{ color: "var(--color-green-700)" }}
                    >
                      ₹ {r.modal_price}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-stone-500 block">
                      {t("mandi.max_price")}
                    </span>
                    <span className="font-semibold text-base text-stone-900">
                      ₹ {r.max_price}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-stone-500">
                    {t("mandi.per_quintal")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Source/Timestamp note per result block */}
          <div className="text-xs text-stone-500 text-center pt-2">
            <span>{data.source}</span> • <span>{t("mandi.last_updated")}: {new Date(data.last_updated).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
