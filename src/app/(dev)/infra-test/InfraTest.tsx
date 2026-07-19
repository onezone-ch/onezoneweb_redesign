"use client";

/**
 * Pagina throwaway di verifica Fase 1 (solo dev):
 * login reale, sessione, cambio lingua runtime, /api/localities, proxy SwissCarInfo.
 * Da eliminare a fine migrazione.
 */

import { useState } from "react";
import { Button, Card, Eyebrow, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n, LANGUAGES } from "@/lib/i18n/I18nProvider";
import * as brokerstar from "@/lib/api/brokerstar";
import { toaster } from "@/lib/toaster";

export function InfraTest() {
  const { ready, isLogged, userData, startSession, logout, getUserName } = useAuth();
  const { lang, setLang, t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const append = (line: string) => setLog((l) => [...l, line]);

  const doLogin = async () => {
    setBusy(true);
    try {
      const res = (await brokerstar.login(username, password)) as { token?: string };
      if (res?.token) {
        const ok = await startSession({ token: res.token });
        append(ok ? "✓ startSession ok, userMe caricato" : "✗ startSession fallito");
        if (ok) toaster.success("Login ok");
      } else {
        append(`✗ login senza token: ${JSON.stringify(res)}`);
      }
    } catch (err) {
      const e = err as { status?: number; body?: unknown };
      append(`✗ login errore ${e.status}: ${JSON.stringify(e.body)}`);
      toaster.warn("Login fallito");
    } finally {
      setBusy(false);
    }
  };

  const testLocalities = async () => {
    const res = await fetch("/api/localities?plz=6900");
    const data = await res.json();
    append(`localities 6900 → ${data.length} risultati: ${JSON.stringify(data.slice(0, 3))}`);
  };

  const testSwissCarInfo = async () => {
    const res = await fetch("/api/swisscarinfo/search?q=golf&type=brand_model&lang=de&limit=3");
    const data = await res.json();
    append(`swisscarinfo golf → success=${data.success}, ${data.data?.length ?? 0} risultati`);
  };

  const testProxyDenied = async () => {
    const res = await fetch("/api/automation/some/forbidden/path", { method: "POST" });
    append(`proxy path fuori allowlist → HTTP ${res.status} (atteso 403)`);
  };

  return (
    <main className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-6 py-10">
      <div>
        <Eyebrow tone="brand">Infra test — Fase 1</Eyebrow>
        <h1 className="mt-1 text-[28px] font-bold tracking-[-0.7px]">Verifica infrastruttura</h1>
      </div>

      <Card>
        <Eyebrow className="mb-3">i18n — lingua: {lang}</Eyebrow>
        <div className="mb-3 flex gap-2">
          {LANGUAGES.map((l) => (
            <Button key={l} size="sm" variant={l === lang ? "primary" : "secondary"} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </Button>
          ))}
        </div>
        <p className="text-[13px] text-ink-2">
          t(&quot;login.title&quot;) → <b>{t("login.title")}</b>
        </p>
        <p className="text-[13px] text-ink-2">
          t(&quot;menu.home&quot;) → <b>{t("menu.home")}</b>
        </p>
      </Card>

      <Card>
        <Eyebrow className="mb-3">Auth — ready: {String(ready)} · logged: {String(ready && isLogged())}</Eyebrow>
        {ready && isLogged() ? (
          <div className="flex flex-col gap-3">
            <p className="text-[15px] font-medium">
              Utente: <b>{getUserName()}</b> (contact.id {String(userData.contact?.id)})
            </p>
            <Button variant="danger" onClick={() => logout()}>
              Logout
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Input label="EMAIL" value={username} onChange={(e) => setUsername(e.target.value)} />
            <Input label="PASSWORD" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button onClick={doLogin} disabled={busy}>
              {busy ? "…" : "Login reale"}
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <Eyebrow className="mb-3">Endpoint</Eyebrow>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={testLocalities}>
            /api/localities
          </Button>
          <Button size="sm" variant="ghost" onClick={testSwissCarInfo}>
            /api/swisscarinfo
          </Button>
          <Button size="sm" variant="ghost" onClick={testProxyDenied}>
            proxy 403
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-1">
          {log.map((line, i) => (
            <p key={i} className="break-all text-[12px] text-ink-2">
              {line}
            </p>
          ))}
        </div>
      </Card>
    </main>
  );
}
