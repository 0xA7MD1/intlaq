import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const WidgetCard = ({
  title,
  subtitle,
  icon,
  colorClass,
  borderClass,
  headerRight,
  className,
  showArrow = true,
  children,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  colorClass: string;
  borderClass?: string;
  headerRight?: React.ReactNode;
  className?: string;
  showArrow?: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "bg-card border-3 border-border/70 rounded-[2.5rem] p-6 md:p-8 flex flex-col relative overflow-hidden group shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300",
      borderClass,
      className,
    )}
  >
    <div className="flex items-center gap-3 mb-4">
      <div
        className={cn(
          "p-2.5 rounded-xl bg-secondary transition-transform duration-300 group-hover:scale-110",
          colorClass,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <h3 className="text-xl font-black tracking-tight truncate">{title}</h3>
        {subtitle ? (
          <p className="text-xs font-bold opacity-40 uppercase tracking-widest mt-1 truncate">
            {subtitle}
          </p>
        ) : null}
      </div>
      {headerRight || showArrow ? (
        <div className="ms-auto flex items-center gap-3">
          {headerRight ? <div>{headerRight}</div> : null}
          {showArrow ? (
            <ArrowUpRight className="h-5 w-5 opacity-20 group-hover:opacity-100 transition-opacity" />
          ) : null}
        </div>
      ) : null}
    </div>
    <div className="flex-1 w-full">{children}</div>
  </div>
);
