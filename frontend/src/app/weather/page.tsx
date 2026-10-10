"use client";

import { useEffect, useState, useCallback } from "react";
import { useI18n } from "@/i18n/provider";
import { api, parseApiError } from "@/lib/api";
import type { components } from "@/lib/api-client/schema";
import {
  CloudSun,
  Droplets,
  Wind,
  Thermometer,
  Calendar,
  AlertCircle,
  RefreshCw,
  MapPin,
  Sprout,
} from "lucide-react";

type WeatherResponse = components["schemas"]["WeatherResponse"];
type StateInfo = components["schemas"]["StateInfo"];

export default function WeatherPage() {
  const { lang, t } = useI18n();

  const [states, setStates] = useState<StateInfo[]>([]);
  const [selectedState, setSelectedState] = useState<string>("Punjab");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Ludhiana");
  const [lat, setLat] = useState<number>(30.901);
  const [lon, setLon] = useState<number>(75.857);

  const [weatherData, setWeatherData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load states and districts from backend location API
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
            setSelectedDistrict(defaultState.districts[0]);
          }
        }
      } catch (err: unknown) {
        setError(parseApiError(err).message);
      }
    }
    loadStates();
  }, []);

  const fetchWeatherData = useCallback(
    async (latitude: number, longitude: number) => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: apiErr } = await api.GET("/api/weather", {
          params: {
            query: {
              lat: latitude,
              lon: longitude,
              lang: lang,
            },
          },
        });

        if (apiErr) {
          setError(parseApiError(apiErr).message);
          setWeatherData(null);
        } else if (data) {
          setWeatherData(data);
        }
      } catch (err: unknown) {
        setError(parseApiError(err).message);
        setWeatherData(null);
      } finally {
        setLoading(false);
      }
    },
    [lang]
  );

  // Initial fetch on mount with cancellation flag
  useEffect(() => {
    let ignore = false;

    async function loadInitial() {
      setLoading(true);
      setError(null);
      try {
        const { data, error: apiErr } = await api.GET("/api/weather", {
          params: {
            query: {
              lat,
              lon,
              lang,
            },
          },
        });

        if (!ignore) {
          if (apiErr) {
            setError(parseApiError(apiErr).message);
            setWeatherData(null);
          } else if (data) {
            setWeatherData(data);
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          setError(parseApiError(err).message);
          setWeatherData(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      ignore = true;
    };
  }, [lat, lon, lang]);

  // Handle location change via district geocoding
  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistrict || !selectedState) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error: geoErr } = await api.GET("/api/location/geocode", {
        params: {
          query: {
            district: selectedDistrict,
            state: selectedState,
          },
        },
      });

      if (geoErr || !data) {
        setError(parseApiError(geoErr).message);
        setLoading(false);
        return;
      }

      setLat(data.lat);
      setLon(data.lon);
      fetchWeatherData(data.lat, data.lon);
    } catch (err: unknown) {
      setError(parseApiError(err).message);
      setLoading(false);
    }
  };

  // Browser geolocation with graceful permission denial
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError(t("weather.location_failed"));
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLon = pos.coords.longitude;
        setLat(userLat);
        setLon(userLon);
        fetchWeatherData(userLat, userLon);
      },
      (geoErr) => {
        setLoading(false);
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          setError(t("weather.permission_denied"));
        } else {
          setError(t("weather.location_failed"));
        }
      },
      { timeout: 10000 }
    );
  };

  const activeDistricts =
    states.find((s) => s.name === selectedState)?.districts || [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header and location picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold"
            style={{ color: "var(--color-brown-900)" }}
          >
            {t("weather.title")}
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            {selectedDistrict}, {selectedState} ({lat.toFixed(2)} N, {lon.toFixed(2)} E)
          </p>
        </div>

        {/* 1. Location picker: state, district dropdowns + Use my location button */}
        <form
          onSubmit={handleLocationSubmit}
          className="flex flex-wrap items-center gap-2"
        >
          <select
            value={selectedState}
            onChange={(e) => {
              const newState = e.target.value;
              setSelectedState(newState);
              const st = states.find((s) => s.name === newState);
              if (st && st.districts.length > 0) {
                setSelectedDistrict(st.districts[0]);
              }
            }}
            aria-label={t("location.select_state")}
            className="px-3 py-2 rounded text-sm bg-white border border-stone-300 font-medium"
            style={{ minHeight: "44px" }}
          >
            {states.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            aria-label={t("location.select_district")}
            className="px-3 py-2 rounded text-sm bg-white border border-stone-300 font-medium"
            style={{ minHeight: "44px" }}
          >
            {activeDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 rounded text-sm font-semibold cursor-pointer"
            style={{
              backgroundColor: "var(--color-green-700)",
              color: "var(--color-white)",
              minHeight: "44px",
            }}
          >
            {t("common.retry") === "Retry" ? "Update" : "ਅੱਪਡੇਟ"}
          </button>

          <button
            type="button"
            onClick={handleUseMyLocation}
            title={t("location.use_my_location")}
            className="px-3 py-2 rounded border border-stone-300 bg-white hover:bg-stone-50 cursor-pointer flex items-center gap-1.5 text-sm"
            style={{ minHeight: "44px" }}
          >
            <MapPin size={18} style={{ color: "var(--color-green-700)" }} />
            <span className="hidden sm:inline">{t("location.use_my_location")}</span>
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          className="p-10 rounded-lg text-center flex flex-col items-center justify-center gap-3 my-6"
          style={{
            backgroundColor: "var(--color-cream-dark)",
            border: "1px solid var(--color-brown-300)",
          }}
        >
          <RefreshCw size={28} className="animate-spin text-stone-600" />
          <p className="text-base font-medium text-stone-700">
            {t("common.loading")}
          </p>
        </div>
      )}

      {/* Honest error state */}
      {error && !loading && (
        <div
          className="p-4 rounded-lg my-6 flex items-start justify-between gap-3"
          style={{
            backgroundColor: "#fdf2f2",
            border: "1px solid var(--color-red-600)",
            color: "var(--color-red-600)",
          }}
        >
          <div className="flex items-start gap-2">
            <AlertCircle size={22} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-base">Weather Notice</p>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchWeatherData(lat, lon)}
            className="px-3 py-1.5 rounded text-sm font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
            style={{
              backgroundColor: "var(--color-red-600)",
              color: "var(--color-white)",
              minHeight: "44px",
            }}
          >
            <RefreshCw size={16} />
            <span>{t("common.retry")}</span>
          </button>
        </div>
      )}

      {/* Empty state when no data and not loading */}
      {!weatherData && !loading && !error && (
        <div
          className="p-12 rounded-lg text-center my-6"
          style={{
            backgroundColor: "var(--color-cream-dark)",
            border: "1px solid var(--color-brown-300)",
          }}
        >
          <CloudSun size={36} className="mx-auto mb-2 text-stone-500" />
          <p className="text-base font-medium text-stone-700">
            {t("weather.empty_state")}
          </p>
        </div>
      )}

      {/* 2. Weather Cards */}
      {weatherData && !loading && (
        <div className="space-y-6">
          {/* Current conditions card */}
          <div
            className="p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-cream-dark)",
              border: "1px solid var(--color-brown-300)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-300 gap-2">
              <div className="flex items-center gap-2">
                <CloudSun size={24} style={{ color: "var(--color-yellow-700)" }} />
                <h2 className="text-xl font-bold" style={{ color: "var(--color-brown-900)" }}>
                  {t("weather.current")}
                </h2>
              </div>
              {/* 3. Source name & last updated time */}
              <div className="text-xs sm:text-sm text-stone-600 flex flex-wrap gap-x-4">
                <span>
                  <strong>{t("weather.source")}:</strong> Open-Meteo
                </span>
                <span>
                  <strong>{t("weather.last_updated")}:</strong>{" "}
                  {new Date(weatherData.last_updated).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-lg bg-white border border-stone-200">
                <div className="flex items-center gap-2 text-stone-600 mb-1">
                  <Thermometer size={18} />
                  <span className="text-sm">Temperature</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: "var(--color-brown-900)" }}>
                  {weatherData.current.temp_c} deg C
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {weatherData.current.weather_description}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-white border border-stone-200">
                <div className="flex items-center gap-2 text-stone-600 mb-1">
                  <Droplets size={18} />
                  <span className="text-sm">Humidity</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: "var(--color-brown-900)" }}>
                  {weatherData.current.humidity_percent}%
                </p>
                <p className="text-xs text-stone-500 mt-1">Relative humidity</p>
              </div>

              <div className="p-4 rounded-lg bg-white border border-stone-200">
                <div className="flex items-center gap-2 text-stone-600 mb-1">
                  <Droplets size={18} />
                  <span className="text-sm">Precipitation</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: "var(--color-brown-900)" }}>
                  {weatherData.current.precipitation_mm} mm
                </p>
                <p className="text-xs text-stone-500 mt-1">Rain / Drizzle</p>
              </div>

              <div className="p-4 rounded-lg bg-white border border-stone-200">
                <div className="flex items-center gap-2 text-stone-600 mb-1">
                  <Wind size={18} />
                  <span className="text-sm">Wind Speed</span>
                </div>
                <p className="text-2xl font-bold" style={{ color: "var(--color-brown-900)" }}>
                  {weatherData.current.wind_speed_kmh ?? "--"} km/h
                </p>
                <p className="text-xs text-stone-500 mt-1">At 10m height</p>
              </div>
            </div>
          </div>

          {/* Farming Advice returned by API */}
          <div
            className="p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-cream-dark)",
              border: "1px solid var(--color-brown-300)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sprout size={22} style={{ color: "var(--color-green-700)" }} />
              <h2 className="text-xl font-bold" style={{ color: "var(--color-brown-900)" }}>
                {t("weather.advice")}
              </h2>
            </div>

            {(weatherData.farming_advice ?? []).length === 0 ? (
              <p className="text-sm text-stone-600 bg-white p-4 rounded-lg border border-stone-200">
                {t("weather.no_advice")}
              </p>
            ) : (
              <div className="space-y-3">
                {(weatherData.farming_advice ?? []).map((advice, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg bg-white border border-stone-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-base text-stone-900">
                        {advice.category}
                      </span>
                      {advice.urgency && (
                        <span className="text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-medium capitalize">
                          {advice.urgency}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-stone-800">{advice.advice}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7-day forecast */}
          <div
            className="p-6 rounded-xl"
            style={{
              backgroundColor: "var(--color-cream-dark)",
              border: "1px solid var(--color-brown-300)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={22} style={{ color: "var(--color-green-700)" }} />
              <h2 className="text-xl font-bold" style={{ color: "var(--color-brown-900)" }}>
                {t("weather.forecast")}
              </h2>
            </div>

            {(weatherData.forecast ?? []).length === 0 ? (
              <p className="text-sm text-stone-600 py-4 text-center">
                {t("common.no_data")}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {(weatherData.forecast ?? []).map((day) => (
                  <div
                    key={day.date}
                    className="p-3 rounded-lg bg-white border border-stone-200 flex flex-col items-center text-center"
                  >
                    <span className="text-xs font-semibold text-stone-600">
                      {new Date(day.date).toLocaleDateString([], {
                        weekday: "short",
                        day: "numeric",
                      })}
                    </span>
                    <CloudSun size={24} className="my-2" style={{ color: "var(--color-yellow-700)" }} />
                    <span className="text-sm font-bold text-stone-900">
                      {Math.round(day.temp_max_c)} deg / {Math.round(day.temp_min_c)} deg
                    </span>
                    <span className="text-xs text-stone-500 mt-1 line-clamp-1">
                      {day.weather_description || "Clear"}
                    </span>
                    {day.precipitation_mm > 0 && (
                      <span className="text-xs text-blue-700 mt-1 font-medium">
                        {day.precipitation_mm} mm
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
