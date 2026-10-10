import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Plant Disease Identification | Farm Assistant",
  description:
    "Upload a leaf photo to diagnose crop diseases and receive safe, non-chemical treatment and prevention guidance with Gemini Vision.",
  openGraph: {
    title: "Plant Disease Identification | Farm Assistant",
    description:
      "Upload a leaf photo to diagnose crop diseases with Gemini Vision. Safe care tips and KVK guidance.",
    type: "website",
  },
};

export default function DiseaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
