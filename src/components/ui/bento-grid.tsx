import type { ReactNode } from "react";
import { ArrowRightIcon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const BentoGrid = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-3 gap-4",
        className,
      )}
    >
      {children}
    </div>
  );
};

const BentoCard = ({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
}: {
  name: string;
  className: string;
  background: ReactNode;
  Icon: any;
  description: string;
  href: string;
  cta: string;
}) => (
  <div
    key={name}
    className={cn(
      "group relative col-span-3 flex flex-col justify-between overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-900/70 backdrop-blur-xl transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_12px_40px_rgba(34,211,238,0.18)]",
      className,
    )}
  >
    <div className="absolute inset-0 z-0">{background}</div>
    <div className="absolute inset-0 z-1 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/40" />

    <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1.5 p-6 transition-all duration-300 group-hover:-translate-y-8">
      <Icon className="h-10 w-10 origin-left transform-gpu text-cyan-400 transition-all duration-300 ease-in-out group-hover:scale-90 group-hover:text-amber-300" />
      <h3 className="text-xl font-bold text-white tracking-tight">
        {name}
      </h3>
      <p className="max-w-lg text-sm text-cyan-100/80 leading-relaxed">{description}</p>
    </div>

    <div
      className={cn(
        "pointer-events-none absolute bottom-0 z-10 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100",
      )}
    >
      <Button variant="ghost" asChild size="sm" className="pointer-events-auto border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 hover:bg-cyan-500/20 hover:text-white">
        <a href={href} className="inline-flex items-center gap-1.5">
          {cta}
          <ArrowRightIcon className="ml-1 h-4 w-4 text-cyan-300" />
        </a>
      </Button>
    </div>
    <div className="pointer-events-none absolute inset-0 z-20 transform-gpu transition-all duration-300 group-hover:bg-cyan-500/5" />
  </div>
);

export { BentoCard, BentoGrid };
