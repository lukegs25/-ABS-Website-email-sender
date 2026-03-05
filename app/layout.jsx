import "./globals.css";
import Sidebar from "../components/Sidebar";

export const metadata = {
  title: "AI in Business Society",
  description: "BYU AI in Business Society",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Sidebar />
        <main className="min-h-screen bg-gray-50/50 pt-14 md:ml-52 md:pt-0">
          {children}
        </main>
      </body>
    </html>
  );
}


