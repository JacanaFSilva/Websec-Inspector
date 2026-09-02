import React from "react";

const styles: Record<string, string> = {
  LOW: "bg-risk-low/20 text-risk-low border-risk-low/40",
  MEDIUM: "bg-risk-medium/20 text-risk-medium border-risk-medium/40",
  HIGH: "bg-risk-high/20 text-risk-high border-risk-high/40",
  CRITICAL: "bg-risk-critical/20 text-risk-critical border-risk-critical/40",
};

const labels: Record<string, string> = {
  LOW: "Baixo",
  MEDIUM: "Médio",
  HIGH: "Alto",
  CRITICAL: "Crítico",
};

export default function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${styles[severity] ?? ""}`}>
      {labels[severity] ?? severity}
    </span>
  );
}
