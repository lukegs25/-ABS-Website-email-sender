import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo.jpeg" alt="AI in Business Society" width={32} height={32} className="h-8 w-8 object-contain" />
          <span className="text-sm font-semibold tracking-wide text-[color:var(--byu-blue)]">AI in Business Society</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="hover:underline">Home</Link>
          <Link href="/student" className="hover:underline">Student</Link>
          <Link href="/teacher" className="hover:underline">Teacher</Link>
          <Link href="/admin" className="hover:underline">Admin</Link>
        </nav>
      </div>
    </header>
  );
}


