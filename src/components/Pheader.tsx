import React from "react";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export const Pheader: React.FC<HeaderProps> = ({ title, subtitle }) => (
  <div>
    <h1 className="text-xl font-semibold mb-1">{title}</h1>
    <h4 className="text-md tracking-wider text-slate-400">{subtitle}</h4>
  </div>
);
