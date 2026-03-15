import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "AgentCover — On-Chain Insurance for AI Agents",
  description: "On-chain coverage for autonomous AI agents. Register, verify via ENS, and get insured.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="pt-14">
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
