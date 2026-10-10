import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Farm Assistant",
  description:
    "Plain and transparent privacy policy for Farm Assistant. Learn how we handle your chat text, leaf photos, and location data with zero server-side storage.",
  openGraph: {
    title: "Privacy Policy | Farm Assistant",
    description:
      "Plain and transparent privacy policy for Farm Assistant. No database, no photo retention, no tracking.",
    type: "website",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
