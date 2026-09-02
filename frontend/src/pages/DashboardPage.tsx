import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">WebSec Inspector</h1>
          <p className="text-sm text-slate-400">Painel de varreduras de segurança</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/scans/novo"
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-ink hover:opacity-90"
          >
            Nova varredura
          </Link>
          <button
            onClick={logout}
            className="rounded-md border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            Sair
          </button>
        </div>
      </header>

      <div className="rounded-xl border border-white/10 bg-panel p-8 text-center text-slate-400">
        <p>
          Nenhum histórico carregado ainda. Este painel consulta{" "}
          <code className="text-accent">/api/scans/domain/&#123;id&#125;/history</code> assim que você
          tiver um domínio verificado — comece submetendo uma nova URL.
        </p>
      </div>
    </div>
  );
}
