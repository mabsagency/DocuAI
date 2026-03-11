import "./globals.css";
import type { Metadata } from "next";
import docuIcon from "../assets/docu.png";

export const metadata: Metadata = {
  title: "DocuAI - SaaS gratuit OCR & éditeur",
  description: "DocuAI : scanner, OCR intelligent, conversion, édition et partage gratuits.",
  icons: {
    icon: docuIcon,
    shortcut: docuIcon,
    apple: docuIcon,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
