import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative bg-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute right-[-6rem] md:right-[-8rem] xl:right-[-14rem] 2xl:right-[-18rem] top-0 h-[80vh] w-1/2">
          <Image
            src="/shaka_clear.png"
            alt="Background shaka hand"
            fill
            priority
            className="object-contain object-right opacity-90 scale-125 xl:scale-115 2xl:scale-110 origin-right"
            sizes="66vw"
          />
        </div>
      </div>
      <section className="relative z-10 py-28 pl-0 pr-8 sm:pl-0 sm:pr-12 lg:pl-0 lg:pr-24 xl:pr-40 2xl:pr-56 -ml-6 sm:-ml-6 lg:-ml-8 xl:-ml-10">
        <h1 className="text-[clamp(3.5rem,10vw,14rem)] font-extrabold tracking-tight leading-[0.9] text-[color:var(--byu-blue)]">
          JOIN THE
        </h1>
        {/* description removed per request */}

        <div className="mt-12 flex flex-wrap gap-5">
          <Link href="/student" className="rounded-md bg-[color:var(--byu-blue)] px-8 py-4 text-white text-lg font-semibold hover:opacity-90">
            I am a Student
          </Link>
          <Link href="/teacher" className="rounded-md border border-[color:var(--byu-blue)] bg-white/70 px-8 py-4 text-[color:var(--byu-blue)] text-lg font-semibold backdrop-blur-[1px] transition-colors duration-200 hover:bg-[color:var(--byu-blue)]/10">
            I am a Teacher
          </Link>
        </div>

        <div className="mt-8 text-lg sm:text-xl">
          <a
            href="https://clubs.byu.edu/p/clubview/18295873491185562"
            target="_blank"
            rel="noreferrer"
            className="text-[color:var(--byu-blue)] underline"
          >
            Sign up for the club at BYU
          </a>
        </div>

        <h2 aria-label="AI IN BUSINESS SOCIETY" className="mt-8 text-[color:var(--byu-blue)] font-extrabold tracking-tight leading-[0.9]">
          <span className="block text-[clamp(2.5rem,9vw,10rem)]">AI IN BUSINESS</span>
          <span className="block text-[clamp(3.5rem,11vw,12rem)]">SOCIETY</span>
        </h2>
      </section>
    </div>
  );
}


