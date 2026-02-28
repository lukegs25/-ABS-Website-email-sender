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
        <main className="ml-52 min-h-screen bg-gray-50/50">
          {children}
        </main>
      </body>
    </html>
  );
}


