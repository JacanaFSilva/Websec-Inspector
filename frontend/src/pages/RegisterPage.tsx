import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register(name, email, password);
      navigate("/");
    } catch {
      setError("Não foi possível concluir o cadastro.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-xl border border-white/10 bg-panel p-8">
        <h1 className="mb-6 text-2xl font-semibold">Criar conta</h1>

        {error && <p className="mb-4 text-sm text-risk-high">{error}</p>}

        <label className="mb-1 block text-sm text-slate-300">Nome</label>
        <input
          className="mb-4 w-full rounded-md border border-white/10 bg-ink px-3 py-2 outline-none focus:border-accent"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label className="mb-1 block text-sm text-slate-300">E-mail</label>
        <input
          className="mb-4 w-full rounded-md border border-white/10 bg-ink px-3 py-2 outline-none focus:border-accent"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label className="mb-1 block text-sm text-slate-300">Senha (mín. 8 caracteres)</label>
        <input
          className="mb-6 w-full rounded-md border border-white/10 bg-ink px-3 py-2 outline-none focus:border-accent"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="w-full rounded-md bg-accent py-2 font-medium text-ink hover:opacity-90" type="submit">
          Cadastrar
        </button>

        <p className="mt-4 text-center text-sm text-slate-400">
          Já tem conta? <Link to="/login" className="text-accent">Entrar</Link>
        </p>
      </form>
    </div>
  );
}
