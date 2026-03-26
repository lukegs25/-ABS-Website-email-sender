import Link from "next/link";
import Image from "next/image";
import { Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-8 sm:flex-row sm:justify-between sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="ABS Logo" width={32} height={32} className="h-8 w-auto" />
          <span className="text-sm text-gray-500">
            AI in Business Society &middot; BYU
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://www.instagram.com/abs.byu/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[color:var(--byu-blue)]"
            aria-label="Instagram"
          >
            <Instagram size={18} />
          </a>
          <a
            href="https://www.linkedin.com/company/ai-in-business-society/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-[color:var(--byu-blue)]"
            aria-label="LinkedIn"
          >
            <Linkedin size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}
