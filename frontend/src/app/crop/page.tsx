"use client";

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "@/i18n/provider";
import { api, parseApiError } from "@/lib/api";
import type { components } from "@/lib/api-client/schema";
import {
  Sprout,
  MapPin,
  LocateFixed,
  AlertCircle,
  Loader2,
  Clock,
  Droplets,
  CloudSun,
  ShieldAlert,
  Layers,
  Calendar,
  Sparkles,
} from "lucide-react";

type CropRecommendResponse = components["schemas"]["CropRecommendResponse"];
type SoilType = components["schemas"]["SoilType"];
type Season = components["schemas"]["Season"];
type WaterAvailability = components["schemas"]["WaterAvailability"];
type StateInfo = components["schemas"]["StateInfo"];

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

const SEASONS: Season[] = ["kharif", "rabi", "zaid"];

const WATER_OPTIONS: WaterAvailability[] = ["irrigated", "rainfed", "limited"];

export default function CropPage() {
  const { lang, t } = useI18n();

  // Location state
  const [states, setStates] = useState<StateInfo[]>([]);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [lat, setLat] = useState<number | null>(null);
  const [lon, setLon] = useState<number | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>("");
  const [locationResolving, setLocationResolving] = useState<boolean>(false);

  // Form parameters
  const [soilType, setSoilType] = useState<SoilType>("alluvial");
  const [season, setSeason] = useState<Season>("rabi");
  const [water, setWater] = useState<WaterAvailability>("irrigated");

  // Validation
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Request & Response state
  const [loading, setLoading] = useState<boolean>(false);
  const [slowNetwork, setSlowNetwork] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CropRecommendResponse | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(false);

  // Load states on mount
  useEffect(() => {
    async function loadStates() {
      try {
        const { data, error: stateErr } = await api.GET("/api/location/states");
        if (stateErr) {
          setError(parseApiError(stateErr).message);
          return;
        }
        if (data && data.length > 0) {
          setStates(data);
          const defaultState = data.find((s) => s.name === "Punjab") || data[0];
          setSelectedState(defaultState.name);
          if (defaultState.districts && defaultState.districts.length > 0) {
            const defaultDist = defaultState.districts[0];
            setSelectedDistrict(defaultDist);
            // Default coordinates for initial state
            setLat(30.901);
            setLon(75.857);
            setLocationLabel(`${defaultDist}, ${defaultState.name}`);
          }
        }
      } catch (err: unknown) {
        setError(parseApiError(err).message);
      }
    }
    loadStates();
  }, []);

  // When state changes, select its first district
  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newState = e.target.value;
    setSelectedState(newState);
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.state;
      return copy;
    });

    const matchedState = states.find((s) => s.name === newState);
    if (matchedState && matchedState.districts.length > 0) {
      const firstDistrict = matchedState.districts[0];
      setSelectedDistrict(firstDistrict);
      resolveDistrictCoordinates(newState, firstDistrict);
    } else {
      setSelectedDistrict("");
      setLat(null);
      setLon(null);
    }
  };

  // When district changes, geocode it
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value;
    setSelectedDistrict(newDistrict);
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.district;
      return copy;
    });
    if (selectedState && newDistrict) {
      resolveDistrictCoordinates(selectedState, newDistrict);
    }
  };

  // Geocode district
  const resolveDistrictCoordinates = useCallback(
    async (stateName: string, districtName: string): Promise<{ lat: number; lon: number } | null> => {
      setLocationResolving(true);
      try {
        const { data, error: geoErr } = await api.GET("/api/location/geocode", {
          params: {
            query: {
              district: districtName,
              state: stateName,
            },
          },
        });
        if (geoErr || !data) {
          return null;
        }
        setLat(data.lat);
        setLon(data.lon);
        setLocationLabel(`${districtName}, ${stateName}`);
        return { lat: data.lat, lon: data.lon };
      } catch {
        return null;
      } finally {
        setLocationResolving(false);
      }
    },
    []
  );

  // Browser geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError(t("weather.location_failed"));
      return;
    }

    setLocationResolving(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        setLat(userLat);
        setLon(userLon);
        setLocationLabel(`${userLat.toFixed(2)} N, ${userLon.toFixed(2)} E`);
        setLocationResolving(false);
        setFieldErrors((prev) => {
          const copy = { ...prev };
          delete copy.location;
          return copy;
        });
      },
      (geoErr) => {
        setLocationResolving(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError(t("weather.permission_denied"));
        } else {
          setError(t("weather.location_failed"));
        }
      },
      { timeout: 10000 }
    );
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Field validations
    const errors: Record<string, string> = {};
    if (!selectedState && lat === null) {
      errors.state = t("crop.error_state_req");
    }
    if (!selectedDistrict && lat === null) {
      errors.district = t("crop.error_state_req");
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
      let submitLat = lat;
      let submitLon = lon;

      // If lat/lon not yet resolved, geocode now
      if (submitLat === null || submitLon === null) {
        if (selectedState && selectedDistrict) {
          const coords = await resolveDistrictCoordinates(selectedState, selectedDistrict);
          if (coords) {
            submitLat = coords.lat;
            submitLon = coords.lon;
          }
        }
      }

      if (submitLat === null || submitLon === null) {
        clearTimeout(slowTimer);
        setLoading(false);
        setError(t("crop.error_location_invalid"));
        return;
      }

      const { data, error: apiErr } = await api.POST("/api/crop/recommend", {
        body: {
          lat: submitLat,
          lon: submitLon,
          soil_type: soilType,
          season: season,
          water_availability: water,
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

  const activeDistricts =
    states.find((s) => s.name === selectedState)?.districts || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Sprout className="w-7 h-7 text-emerald-700" aria-hidden="true" />
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: "var(--color-brown-900)" }}
          >
            {t("crop.title")}
          </h1>
        </div>
        <p className="text-base text-stone-600">
          {t("crop.subtitle")}
        </p>
      </div>

      {/* Main Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-xs mb-8"
      >
        <div className="space-y-6">
          {/* Location Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label
                htmlFor="crop-state-select"
                className="text-base font-semibold text-stone-900 flex items-center gap-1.5"
              >
                <MapPin className="w-5 h-5 text-emerald-700" aria-hidden="true" />
                <span>{t("crop.location")}</span>
              </label>

              <button
                type="button"
                id="crop-use-location-btn"
                onClick={handleUseMyLocation}
                disabled={locationResolving || loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-base text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 min-h-[44px] transition-colors duration-150 disabled:opacity-60"
              >
                <LocateFixed className="w-4 h-4" aria-hidden="true" />
                <span>{t("crop.use_location")}</span>
              </button>
            </div>

            {locationLabel && (
              <p className="text-base text-stone-600 bg-stone-50 px-3 py-1.5 rounded-md border border-stone-200 inline-block">
                {locationLabel}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="crop-state-select"
                  className="block text-base font-medium text-stone-700 mb-1"
                >
                  {t("crop.state")}
                </label>
                <select
                  id="crop-state-select"
                  value={selectedState}
                  onChange={handleStateChange}
                  disabled={loading}
                  className="w-full text-base px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-colors duration-150"
                >
                  <option value="">{t("crop.select_state")}</option>
                  {states.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.state && (
                  <p className="text-base text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    <span>{fieldErrors.state}</span>
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="crop-district-select"
                  className="block text-base font-medium text-stone-700 mb-1"
                >
                  {t("crop.district")}
                </label>
                <select
                  id="crop-district-select"
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  disabled={loading || activeDistricts.length === 0}
                  className="w-full text-base px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-colors duration-150"
                >
                  <option value="">{t("crop.select_district")}</option>
                  {activeDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                {fieldErrors.district && (
                  <p className="text-base text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" aria-hidden="true" />
                    <span>{fieldErrors.district}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <hr className="border-stone-200" />

          {/* Agricultural Conditions Section */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Soil Type */}
            <div>
              <label
                htmlFor="crop-soil-type"
                className="block text-base font-medium text-stone-900 mb-1 flex items-center gap-1"
              >
                <Layers className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>{t("crop.soil_type")}</span>
              </label>
              <select
                id="crop-soil-type"
                value={soilType}
                onChange={(e) => setSoilType(e.target.value as SoilType)}
                disabled={loading}
                className="w-full text-base px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-colors duration-150"
              >
                {SOIL_TYPES.map((st) => (
                  <option key={st} value={st}>
                    {t(`crop.soil.${st}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Season */}
            <div>
              <label
                htmlFor="crop-season"
                className="block text-base font-medium text-stone-900 mb-1 flex items-center gap-1"
              >
                <Calendar className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>{t("crop.season")}</span>
              </label>
              <select
                id="crop-season"
                value={season}
                onChange={(e) => setSeason(e.target.value as Season)}
                disabled={loading}
                className="w-full text-base px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-colors duration-150"
              >
                {SEASONS.map((sn) => (
                  <option key={sn} value={sn}>
                    {t(`crop.season.${sn}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Water Availability */}
            <div>
              <label
                htmlFor="crop-water"
                className="block text-base font-medium text-stone-900 mb-1 flex items-center gap-1"
              >
                <Droplets className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                <span>{t("crop.water")}</span>
              </label>
              <select
                id="crop-water"
                value={water}
                onChange={(e) => setWater(e.target.value as WaterAvailability)}
                disabled={loading}
                className="w-full text-base px-3 py-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 transition-colors duration-150"
              >
                {WATER_OPTIONS.map((wo) => (
                  <option key={wo} value={wo}>
                    {t(`crop.water.${wo}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              id="crop-submit-btn"
              disabled={loading || locationResolving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg min-h-[44px] transition-colors duration-150 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  <span>{t("crop.loading")}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                  <span>{t("crop.get_recommendations")}</span>
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
          <p className="text-base">{t("crop.slow_network")}</p>
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
          {/* Weather Context if present */}
          {result.weather_summary && (
            <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 flex items-center gap-3">
              <CloudSun className="w-6 h-6 text-stone-700 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-base font-semibold text-stone-900">
                  {t("crop.weather_summary")}
                </p>
                <p className="text-base text-stone-700">{result.weather_summary}</p>
              </div>
            </div>
          )}

          {/* Recommendations Cards or Empty State */}
          {result.recommendations && result.recommendations.length > 0 ? (
            <div className="space-y-4">
              {result.recommendations.slice(0, 5).map((rec, idx) => (
                <div
                  key={`${rec.crop_name}-${idx}`}
                  className="bg-white rounded-xl border border-stone-200 p-5 sm:p-6 shadow-xs hover:border-emerald-400 transition-colors duration-150"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-6 h-6 text-emerald-700 shrink-0" aria-hidden="true" />
                      <h2 className="text-xl font-bold text-stone-900">
                        {rec.crop_name}
                      </h2>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-base font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <span>{t("crop.suitability")}:</span>
                      <span>{Math.round(rec.suitability_score * 100)}%</span>
                    </div>
                  </div>

                  <p className="text-base text-stone-700 mb-4 leading-relaxed">
                    {rec.reasoning}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100 text-base">
                    {rec.expected_duration_days && (
                      <div className="flex items-center gap-2 text-stone-700">
                        <Clock className="w-4 h-4 text-stone-500 shrink-0" aria-hidden="true" />
                        <span className="font-medium">{t("crop.duration")}:</span>
                        <span>
                          {rec.expected_duration_days} {t("crop.days")}
                        </span>
                      </div>
                    )}

                    {rec.water_requirement && (
                      <div className="flex items-center gap-2 text-stone-700">
                        <Droplets className="w-4 h-4 text-stone-500 shrink-0" aria-hidden="true" />
                        <span className="font-medium">{t("crop.water_need")}:</span>
                        <span>{rec.water_requirement}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
              <Sprout className="w-12 h-12 text-stone-400 mx-auto mb-3" aria-hidden="true" />
              <h2 className="text-lg font-bold text-stone-900 mb-1">
                {t("crop.empty_title")}
              </h2>
              <p className="text-base text-stone-600">
                {t("crop.empty_desc")}
              </p>
            </div>
          )}

          {/* Official API Disclaimer */}
          {result.disclaimer && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-base text-amber-900">{result.disclaimer}</p>
            </div>
          )}
        </div>
      )}

      {/* Initial Empty state before submit */}
      {!result && !loading && !error && !submitted && (
        <div className="bg-stone-50 border border-stone-200 rounded-xl p-8 text-center">
          <Sprout className="w-12 h-12 text-stone-400 mx-auto mb-3" aria-hidden="true" />
          <p className="text-base text-stone-600">
            {t("crop.subtitle")}
          </p>
        </div>
      )}
    </div>
  );
}
