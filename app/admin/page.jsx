import Image from "next/image";

export default function AdminPage() {
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
      <section className="relative z-10 py-28 pl-0 pr-8 sm:pl-0 sm:pr-12 lg:pl-0 lg:pr-24 xl:pr-40 2xl:pr-56 -ml-6 sm:-ml-6 lg:-ml-8 xl:-ml-10">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Stub view. Will include lists, generate email, uploads, settings.</p>
      </section>
    </div>
  );
}


