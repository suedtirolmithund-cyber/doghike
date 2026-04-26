import { ArrowRight } from "lucide-react";

export default function AppLoadingScreen() {
  return <ExtendedLoadingScreen />;
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
