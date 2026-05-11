import { ArrowRight } from "lucide-react";

export default function AppLoadingScreen() {
  return <ExtendedLoadingScreen />;
}

function ExtendedLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-black md:grid md:place-items-center">
      <section className="relative mx-auto h-[812px] max-h-[100dvh] w-full max-w-[375px] overflow-hidden rounded-[23px] bg-black md:bg-transparent">
        <div className="absolute inset-0 bg-black" />

        <div className="absolute left-[40px] top-[675px] h-[58px] w-[285px] opacity-80">
          <p className="h-[58px] w-[285px] text-center text-[25px] font-medium leading-[29px] text-white">
            Halte deine schönsten Wanderungen fest
          </p>
        </div>

        <div
          className="absolute left-[162px] top-[746px] grid h-[54px] w-[52px] place-items-center rounded-full bg-[#c03060]/80 text-white"
          style={{ mixBlendMode: "plus-lighter" }}
        >
          <ArrowRight className="h-[31px] w-[31px] stroke-[2.4]" />
        </div>
      </section>
    </div>
  );
}
