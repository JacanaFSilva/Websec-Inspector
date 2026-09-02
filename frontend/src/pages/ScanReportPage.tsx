import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getScan, ScanResponse } from "../services/api";
import SeverityBadge from "../components/SeverityBadge";

export default function ScanReportPage() {
  const { id } = useParams();
  const [scan, setScan] = useState<ScanResponse | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;

    async function poll() {
      const data = await getScan(Number(id));
      if (active) setScan(data);
      if (active && (data.status === "QUEUED" || data.status === "RUNNING")) {
        setTimeout(poll, 4000);
      }
    }
    poll();

    return () => {
      active = false;
    };
  }, [id]);

  if (!scan) {
    return <div className="px-6 py-10 text-slate-400">Carregando...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-xl font-semibold">{scan.hostname}</h1>
      <p className="mb-6 text-sm text-slate-400">Status: {scan.status}</p>

      {scan.findings.length === 0 ? (
        <p className="text-slate-400">
          {scan.status === "COMPLETED"
            ? "Nenhuma vulnerabilidade encontrada."
            : "Aguardando conclusão da varredura..."}
        </p>
      ) : (
        <ul className="space-y-3">
          {scan.findings.map((f) => (
            <li key={f.id} className="rounded-xl border border-white/10 bg-panel p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{f.owaspCategory}</span>
                <SeverityBadge severity={f.severity} />
              </div>
              <p className="mb-2 text-sm text-slate-300">{f.description}</p>
              <p className="text-xs text-slate-500">CVSS {f.cvssScore.toFixed(1)} — {f.recommendation}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
