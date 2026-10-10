import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Farm Assistant",
  description:
    "Terms of service for Farm Assistant. Informational farming advice only, limitation of liability, no chemical dosage advice, and governing law.",
  openGraph: {
    title: "Terms of Service | Farm Assistant",
    description:
      "Terms of service for Farm Assistant. Informational farming advice only, no liability for crop loss.",
    type: "website",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
