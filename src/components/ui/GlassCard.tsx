import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'motion/react';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  variant?: 'premium' | 'subtle' | 'solid';
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, variant = 'premium', ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'bg-white/[0.06] border border-white/[0.12] rounded-[20px] p-4 backdrop-blur-[10px]',
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

export const SectionLabel = ({children, className}: {children: React.ReactNode, className?: string}) => (
  <div className={cn("text-[10px] font-bold uppercase text-[#4a90e2] mb-3 tracking-[1px]", className)}>
    {children}
  </div>
);

export const Metric = ({ label, value, subtext, icon: Icon }: { label: string, value: string | React.ReactNode, subtext?: string, icon?: any }) => (
  <div className="flex flex-col">
    <div className="flex gap-1 items-center">
      {Icon && <Icon className="w-3 h-3 text-white/50" />}
      <span className="text-[10px] text-white/50 uppercase">{label}</span>
    </div>
    <b className="text-[16px] font-bold mt-1 font-sans">{value}</b>
    {subtext && <span className="text-[10px] text-white/50 mt-0.5">{subtext}</span>}
  </div>
);
