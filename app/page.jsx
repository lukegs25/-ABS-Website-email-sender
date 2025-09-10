import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/shakka.png"
          alt="Background hand"
          fill
          priority
          quality={100}
          className="object-contain object-right md:object-right-bottom opacity-80 scale-[2] origin-right md:origin-right-bottom"
          sizes="(min-width: 1024px) 1200px, 100vw"
        />
      </div>

      <section className="relative z-10 px-8 py-24 sm:px-12 lg:px-24 md:pr-[28rem]">
        <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight leading-[0.9] text-[color:var(--byu-blue)]">
          JOIN THE
        </h1>
        <p className="mt-6 max-w-xl text-gray-700">
          BYU AI in Business Society brings events, resources, and news to students and faculty.
          Choose your path below and get on the right email lists.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/student" className="rounded-md bg-[color:var(--byu-blue)] px-6 py-3 text-white font-semibold hover:opacity-90">
            I am a Student
          </Link>
          <Link href="/teacher" className="rounded-md border border-[color:var(--byu-blue)] px-6 py-3 text-[color:var(--byu-blue)] font-semibold hover:bg-blue-50">
            I am a Teacher
          </Link>
        </div>

        <div className="mt-8">
          <a
            href="https://clubs.byu.edu/p/clubview/18295873491185562"
            target="_blank"
            rel="noreferrer"
            className="text-[color:var(--byu-blue)] underline"
          >
            Sign up for the club at BYU
          </a>
        </div>
      </section>
    </div>
  );
}


