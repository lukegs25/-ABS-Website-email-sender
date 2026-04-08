import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";

export const metadata = {
  title: "AI in Business Society — BYU",
  description:
    "BYU's AI in Business Society — connecting students and faculty with the tools, skills, and community to lead in an AI-driven world.",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
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
        <main className="flex min-h-screen flex-col bg-gray-50/50 pt-14 md:pt-0 sidebar-main">
          <div className="flex-1">{children}</div>
          <Footer />
        </main>
      </body>
    </html>
  );
}
