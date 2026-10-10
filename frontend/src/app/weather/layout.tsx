import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weather and Farming Advice | Farm Assistant",
  description:
    "7-day weather forecast and practical farming advice for sowing, irrigation, and spraying based on Open-Meteo data.",
  openGraph: {
    title: "Weather and Farming Advice | Farm Assistant",
    description:
      "7-day agricultural weather forecast and farming guidance from Open-Meteo.",
    type: "website",
  },
};

export default function WeatherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
