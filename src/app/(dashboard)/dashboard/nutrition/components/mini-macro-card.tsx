import React from "react";

type MiniMacroCardProps = {
  title: string;
  value: number;
  unit: string;
  color: string;
};

export function MiniMacroCard({ title, value, unit, color }: MiniMacroCardProps) {
  return (
    <div className="bg-secondary/30 border border-border p-4 rounded-[1.5rem] flex flex-col items-center justify-center text-center">
      <span className="text-[10px] font-black opacity-40 uppercase tracking-widest mb-1">{title}</span>
      <div className={`text-xl font-black ${color}`}>{value}</div>
      <span className="text-[9px] font-bold opacity-30">{unit}</span>
    </div>
  );
}
