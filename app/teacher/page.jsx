import Image from "next/image";
import TeacherForm from "@/components/forms/TeacherForm";

export default function TeacherPage() {
  return (
    <div className="relative bg-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute right-[-6rem] md:right-[-8rem] xl:right-[-14rem] 2xl:right-[-18rem] top-0 h-[80vh] w-1/2 min-w-[560px] md:min-w-[640px] xl:min-w-[780px]">
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

      <section className="relative z-10">
        <h1 className="text-[clamp(3.5rem,10vw,14rem)] font-extrabold tracking-tight leading-[0.9] text-[color:var(--byu-blue)]">Teacher Signup</h1>
        <div className="mt-6 inline-block max-w-xl rounded-md border border-[color:var(--byu-blue)] bg-white/70 p-3 backdrop-blur-[1px]">
          <TeacherForm />
        </div>
      </section>
    </div>
  );
}


