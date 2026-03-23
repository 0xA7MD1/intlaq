import React from "react";

type MacroCardProps = {
  title: string;
  value: string;
  total: string;
  color: string;
  bgColor: string;
  percent: string;
};

export function MacroCard({ title, value, total, color, bgColor, percent }: MacroCardProps) {
  return (
    <div className="bg-card border rounded-[2rem] p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
      <span className="text-[10px] font-black opacity-40 uppercase">{title}</span>
      <div>
        <span className={`text-2xl font-black ${color}`}>{value}</span>
        <span className="text-[10px] opacity-30 block font-bold">من {total}</span>
      </div>
      <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${bgColor} rounded-full`} style={{ width: percent }} />
      </div>
    </div>
  );
}
