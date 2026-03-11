import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DocuAI - SaaS gratuit OCR & éditeur",
  description: "DocuAI : scanner, OCR intelligent, conversion, édition et partage gratuits.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
