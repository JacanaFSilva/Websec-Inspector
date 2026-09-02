import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitScan, confirmVerification } from "../services/api";

const POLL_INTERVAL_SECONDS = 15;

export default function SubmitScanPage() {
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [step, setStep] = useState<"form" | "verifying">("form");
  const [scanId, setScanId] = useState<number | null>(null);
  const [hostname, setHostname] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Estado da verificação automática: enquanto pendingMessage estiver
  // preenchido, o botão continua tentando em segundo plano até a
  // propagação do DNS/meta tag terminar, em vez de mostrar um erro fatal.
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [nextRetryIn, setNextRetryIn] = useState<number | null>(null);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => clearPolling();
  }, []);

  function clearPolling() {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    pollTimeoutRef.current = null;
    countdownRef.current = null;
    setNextRetryIn(null);
  }

  function schedulePoll() {
    clearPolling();
    setNextRetryIn(POLL_INTERVAL_SECONDS);
    countdownRef.current = setInterval(() => {
      setNextRetryIn((prev) => (prev && prev > 1 ? prev - 1 : 0));
    }, 1000);
    pollTimeoutRef.current = setTimeout(() => {
      attemptConfirm();
    }, POLL_INTERVAL_SECONDS * 1000);
  }

  function normalizeUrl(raw: string): string {
    let url = raw.trim();
    if (!url) return url;
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }
    try {
      const parsed = new URL(url);
      if (parsed.hostname.startsWith("www.")) {
        parsed.hostname = parsed.hostname.slice(4);
        url = parsed.toString();
      }
    } catch {
      // keep as-is if URL parsing fails; backend will validate
    }
    return url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const normalized = normalizeUrl(url);
      const scan = await submitScan(normalized);
      setScanId(scan.id);
      setHostname(scan.hostname);
      setToken(scan.verificationToken ?? "");
      setStep("verifying");
    } catch (err: unknown) {
      setError(resolveErrorMessage(err));
    }
  }

  function resolveErrorMessage(err: unknown): string {
    const axiosErr = err as { response?: { status?: number; data?: { error?: string } } };
    const serverMessage = axiosErr?.response?.data?.error;
    if (serverMessage) return serverMessage;

    if (!axiosErr?.response) {
      return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
    }
    if (axiosErr.response.status === 401 || axiosErr.response.status === 403) {
      return "Sua sessão expirou. Faça login novamente.";
    }
    return "Não foi possível iniciar a análise. Verifique a URL informada.";
  }

  /**
   * Tenta confirmar a verificação. Se o backend responder que a propagação
   * ainda não terminou (VERIFICATION_PENDING), não trata como erro: mostra
   * um aviso e agenda uma nova tentativa automática, mantendo o usuário na
   * mesma tela até a verificação realmente passar.
   */
  async function attemptConfirm() {
    if (!scanId) return;
    setChecking(true);
    try {
      await confirmVerification(scanId);
      clearPolling();
      navigate(`/scans/${scanId}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string; code?: string } } };
      const code = axiosErr?.response?.data?.code;
      if (code === "VERIFICATION_PENDING") {
        setError(null);
        setPendingMessage(
          axiosErr.response?.data?.error ??
            "Ainda não encontramos o registro de verificação. A propagação de DNS pode levar alguns minutos."
        );
        schedulePoll();
      } else {
        clearPolling();
        setPendingMessage(null);
        setError(resolveErrorMessage(err));
      }
    } finally {
      setChecking(false);
    }
  }

  function handleConfirmClick() {
    // Clique manual: tenta na hora e reinicia o ciclo de espera automática.
    attemptConfirm();
  }

  function handleCancelPolling() {
    clearPolling();
    setPendingMessage(null);
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="mb-6 text-xl font-semibold">Nova varredura de segurança</h1>

      {error && <p className="mb-4 text-sm text-risk-high">{error}</p>}

      {step === "form" && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-panel p-6">
          <label className="mb-1 block text-sm text-slate-300">URL do site a analisar</label>
          <input
            className="mb-4 w-full rounded-md border border-white/10 bg-ink px-3 py-2 outline-none focus:border-accent"
            placeholder="meusite.com.br ou https://meusite.com.br"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <button className="w-full rounded-md bg-accent py-2 font-medium text-ink hover:opacity-90" type="submit">
            Continuar
          </button>
        </form>
      )}

      {step === "verifying" && (
        <div className="rounded-xl border border-white/10 bg-panel p-6 space-y-5">
          <h2 className="font-medium">Verifique a propriedade do domínio</h2>
          <p className="text-sm text-slate-400">
            Para garantir que apenas donos de domínio possam executar varreduras,
            prove que você controla <strong className="text-slate-200">{hostname}</strong> adicionando
            um dos registros abaixo.
          </p>

          <div className="rounded-lg border border-white/10 bg-ink p-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-200">Opção 1 — Registro DNS TXT (recomendado)</h3>
            <ol className="list-decimal list-inside text-sm text-slate-400 space-y-2">
              <li>
                Acesse o painel de DNS do seu provedor (ex.: Registro.br, Cloudflare, GoDaddy).
              </li>
              <li>
                Crie um novo registro <strong className="text-slate-200">TXT</strong> no domínio:
                <div className="mt-1 flex items-center gap-2 rounded bg-panel px-3 py-1.5">
                  <code className="text-xs text-accent select-all flex-1">{hostname}</code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(hostname, "host")}
                    className="text-xs text-slate-400 hover:text-white shrink-0"
                  >
                    {copied === "host" ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </li>
              <li>
                No campo <em>Valor</em>, cole o token abaixo:
                <div className="mt-1 flex items-center gap-2 rounded bg-panel px-3 py-1.5">
                  <code className="text-xs text-accent select-all flex-1 break-all">{token}</code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(token, "token")}
                    className="text-xs text-slate-400 hover:text-white shrink-0"
                  >
                    {copied === "token" ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </li>
              <li>Salve e aguarde a propagação (pode levar alguns minutos).</li>
            </ol>
          </div>

          <div className="rounded-lg border border-white/10 bg-ink p-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-200">Opção 2 — Meta tag HTML</h3>
            <p className="text-sm text-slate-400">
              Adicione a tag abaixo no <code className="text-accent">&lt;head&gt;</code> da página inicial do site:
            </p>
            <div className="flex items-center gap-2 rounded bg-panel px-3 py-1.5">
              <code className="text-xs text-accent select-all flex-1 break-all">
                {`<meta name="websec-verification" content="${token}" />`}
              </code>
              <button
                type="button"
                onClick={() => copyToClipboard(`<meta name="websec-verification" content="${token}" />`, "meta")}
                className="text-xs text-slate-400 hover:text-white shrink-0"
              >
                {copied === "meta" ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          {pendingMessage && (
            <div className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-4 space-y-2">
              <p className="text-sm text-amber-300">{pendingMessage}</p>
              {nextRetryIn !== null && (
                <p className="text-xs text-amber-300/80">
                  Nova tentativa automática em {nextRetryIn}s...
                </p>
              )}
              <button
                type="button"
                onClick={handleCancelPolling}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Cancelar verificação automática
              </button>
            </div>
          )}

          <button
            onClick={handleConfirmClick}
            disabled={checking}
            className="w-full rounded-md bg-accent py-2 font-medium text-ink hover:opacity-90 disabled:opacity-60"
          >
            {checking
              ? "Verificando..."
              : pendingMessage
              ? "Tentar agora"
              : "Já verifiquei, iniciar varredura"}
          </button>
        </div>
      )}
    </div>
  );
}
