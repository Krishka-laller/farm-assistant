import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mandi Prices | Farm Assistant",
  description:
    "Look up real-time agricultural commodity mandi prices across Indian states and districts from Agmarknet (data.gov.in).",
  openGraph: {
    title: "Mandi Prices | Farm Assistant",
    description:
      "Look up real-time agricultural commodity mandi prices across Indian states and districts from Agmarknet.",
    type: "website",
  },
};

export default function MandiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
