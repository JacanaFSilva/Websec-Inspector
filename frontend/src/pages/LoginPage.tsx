import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Credenciais inválidas.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-white/10 bg-panel p-8">
        <h1 className="mb-1 text-2xl font-semibold">WebSec Inspector</h1>
        <p className="mb-6 text-sm text-slate-400">Entre para acompanhar suas varreduras de segurança.</p>

        {error && <p className="mb-4 text-sm text-risk-high">{error}</p>}

        <label className="mb-1 block text-sm text-slate-300">E-mail</label>
        <input
          className="mb-4 w-full rounded-md border border-white/10 bg-ink px-3 py-2 outline-none focus:border-accent"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="mb-1 block text-sm text-slate-300">Senha</label>
        <input
          className="mb-6 w-full rounded-md border border-white/10 bg-ink px-3 py-2 outline-none focus:border-accent"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="w-full rounded-md bg-accent py-2 font-medium text-ink hover:opacity-90" type="submit">
          Entrar
        </button>

        <p className="mt-4 text-center text-sm text-slate-400">
          Não tem conta? <Link to="/registrar" className="text-accent">Cadastre-se</Link>
        </p>
      </form>
    </div>
  );
}
