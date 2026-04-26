import { ArrowRight, Mountain } from "lucide-react";

export default function AppLoadingScreen({ extended = false }) {
  if (extended) {
    return <ExtendedLoadingScreen />;
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-slate-950 text-white">
      <img
        src="/splash/autumn-hero.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover md:object-contain"
        style={{ objectPosition: "center 38%" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/65 via-slate-950/45 to-slate-950/70" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
          <Mountain className="h-8 w-8" />
        </div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
          DogHike
        </p>
        <h1 className="max-w-xl text-4xl font-light leading-tight tracking-tight md:text-6xl">
          Hundefreundliche Wanderungen
        </h1>
        <p className="mt-5 max-w-md text-base leading-relaxed text-white/75 md:text-lg">
          Entdecke schöne Wege in Südtirol zusammen mit deinem Vierbeiner.
        </p>
      </div>
    </div>
  );
}

function ExtendedLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-black md:grid md:place-items-center">
      <img
        src="/onboarding/A730214.jpg"
        alt=""
        className="hidden md:block md:absolute md:inset-0 md:h-full md:w-full md:object-contain"
      />
      <section className="relative mx-auto h-[812px] max-h-[100dvh] w-full max-w-[375px] overflow-hidden rounded-[23px] bg-black md:bg-transparent">
        <img
          src="/onboarding/A730214.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover md:hidden"
          style={{ objectPosition: "center center" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,#000000_-31.83%,rgba(0,0,0,0)_43.72%)]" />

        <div className="absolute left-[40px] top-[675px] h-[58px] w-[285px] opacity-80">
          <p className="h-[58px] w-[285px] text-center font-['Roboto',sans-serif] text-[25px] font-medium leading-[29px] text-white">
            Halte deine schönsten Wanderungen fest
          </p>
        </div>

        <div
          className="absolute left-[162px] top-[746px] grid h-[54px] w-[52px] place-items-center rounded-full bg-[#BE8C70]/80 text-white"
          style={{ mixBlendMode: "plus-lighter" }}
        >
          <ArrowRight className="h-[31px] w-[31px] stroke-[2.4]" />
        </div>
      </section>
    </div>
  );
}
