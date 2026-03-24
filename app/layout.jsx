import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Sidebar from "../components/Sidebar";

export const metadata = {
  title: "AI in Business Society — BYU",
  description:
    "BYU's AI in Business Society — connecting students and faculty with the tools, skills, and community to lead in an AI-driven world.",
  openGraph: {
    title: "AI in Business Society — BYU",
    description:
      "BYU's AI in Business Society — connecting students and faculty with the tools, skills, and community to lead in an AI-driven world.",
    siteName: "ABS at BYU",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        <Sidebar />
        <main className="min-h-screen bg-gray-50/50 pt-14 md:pt-0 sidebar-main">
          {children}
        </main>
      </body>
    </html>
  );
}
