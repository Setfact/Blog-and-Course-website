import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedFeatureCardProps extends Omit<HTMLMotionProps<"div">, "title"> {
  index: string;
  tag: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  imageSrc: string;
  color: "orange" | "purple" | "blue" | "cyan" | "emerald";
}

const colorVariants = {
  orange: {
    '--feature-color': 'hsl(35, 91%, 50%)',
    '--feature-color-light': 'rgba(245, 158, 11, 0.18)',
    '--feature-color-dark': '#fffbe6',
    '--feature-badge-text': '#b45309',
    '--feature-border': 'rgba(245, 158, 11, 0.28)',
  },
  purple: {
    '--feature-color': 'hsl(262, 85%, 58%)',
    '--feature-color-light': 'rgba(168, 85, 247, 0.18)',
    '--feature-color-dark': '#f5f3ff',
    '--feature-badge-text': '#6b21a8',
    '--feature-border': 'rgba(168, 85, 247, 0.28)',
  },
  blue: {
    '--feature-color': 'hsl(211, 100%, 55%)',
    '--feature-color-light': 'rgba(59, 130, 246, 0.18)',
    '--feature-color-dark': '#eff6ff',
    '--feature-badge-text': '#1e40af',
    '--feature-border': 'rgba(59, 130, 246, 0.28)',
  },
  cyan: {
    '--feature-color': 'hsl(190, 95%, 45%)',
    '--feature-color-light': 'rgba(6, 182, 212, 0.18)',
    '--feature-color-dark': '#ecfeff',
    '--feature-badge-text': '#0e7490',
    '--feature-border': 'rgba(6, 182, 212, 0.28)',
  },
  emerald: {
    '--feature-color': 'hsl(150, 85%, 40%)',
    '--feature-color-light': 'rgba(16, 185, 129, 0.18)',
    '--feature-color-dark': '#ecfdf5',
    '--feature-badge-text': '#047857',
    '--feature-border': 'rgba(16, 185, 129, 0.28)',
  },
};

const AnimatedFeatureCard = React.forwardRef<
  HTMLDivElement,
  AnimatedFeatureCardProps
>(({ className, index, tag, title, description, imageSrc, color, ...props }, ref) => {
  const cardStyle = colorVariants[color] as React.CSSProperties;

  return (
    <motion.div
      ref={ref}
      style={cardStyle}
      className={cn(
        "relative flex h-[410px] w-full flex-col justify-between overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-colors duration-200 hover:border-[var(--feature-color)]",
        className
      )}
      whileHover="hover"
      initial="initial"
      variants={{
        initial: { y: 0 },
        hover: { y: -8, boxShadow: "0 22px 30px -10px rgba(8, 42, 81, 0.12)" },
      }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      {...props}
    >
      {/* Background Radial Glow */}
      <div
        className="absolute inset-0 z-0 opacity-60 transition-opacity duration-300 group-hover:opacity-90"
        style={{
          background: `radial-gradient(circle at 50% 32%, var(--feature-color-light) 0%, transparent 68%)`
        }}
      />
      
      {/* Header index & badge */}
      <div className="relative z-20 flex items-center justify-between gap-2">
        <span
          className="inline-block rounded-full px-3 py-1 text-xs font-extrabold tracking-wider uppercase"
          style={{ 
            backgroundColor: 'var(--feature-color-dark)', 
            color: 'var(--feature-badge-text)',
            border: '1px solid var(--feature-border)'
          }}
        >
          {tag}
        </span>
        <div className="font-mono text-base font-extrabold text-slate-400">
          {index}
        </div>
      </div>

      {/* Center Animated Milestone Image */}
      <motion.div 
        className="relative z-10 my-auto flex items-center justify-center py-2"
        variants={{
          initial: { scale: 1, y: 0 },
          hover: { scale: 1.15, y: -10 },
        }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
      >
        <img
          src={imageSrc}
          alt={tag}
          className="h-32 w-32 object-contain filter drop-shadow-md"
        />
      </motion.div>
      
      {/* Footer Content Box */}
      <div className="relative z-20 rounded-xl border border-slate-100 bg-white/95 p-4 shadow-sm backdrop-blur-md">
        <h3 className="mb-1 text-base font-bold text-slate-900 leading-snug">{title}</h3>
        {description && (
          <p className="text-xs text-slate-600 leading-relaxed">{description}</p>
        )}
      </div>
    </motion.div>
  );
});
AnimatedFeatureCard.displayName = "AnimatedFeatureCard";

export { AnimatedFeatureCard };
