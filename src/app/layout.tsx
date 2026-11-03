import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewOS — Unified ATS, System Design, AI Mock Interview & Visual Patterns Suite",
  description:
    "All-in-one job applicant & technical interview preparation platform combining the best of HelloInterview, Aced.io, ByteByteGo, Jobscan, and Huntr."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
