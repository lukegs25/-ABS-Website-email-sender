import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full border-b bg-white relative z-50">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image src="/logo.png" alt="AI in Business Society" width={640} height={160} className="h-14 md:h-16 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/join" className="hover:underline">Join</Link>
          <Link href="/jobs" className="hover:underline">Jobs</Link>
          <Link href="/login" className="hover:underline">Login</Link>
        </nav>
      </div>
    </header>
  );
}


