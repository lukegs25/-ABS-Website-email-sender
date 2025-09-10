import "./globals.css";
import Header from "../components/Header";

export const metadata = {
  title: "AI in Business Society",
  description: "BYU AI in Business Society",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="mx-auto max-w-6xl px-6 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}


