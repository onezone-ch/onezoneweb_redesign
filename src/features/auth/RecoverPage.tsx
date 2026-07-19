"use client";

/**
 * Port di recover.component — due modalità in una pagina (parità):
 * senza codice → richiesta email; con codice → conferma nuova password.
 */

import { useState } from "react";
import { isset } from "@/lib/helper";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import * as brokerstar from "@/lib/api/brokerstar";
import { toaster } from "@/lib/toaster";
import { Button, Input } from "@/components/ui";

export function RecoverPage() {
  const { t } = useI18n();
  const loader = useLoader();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const submit = async () => {
    loader.show();
    try {
      if (isset(code, true)) {
        await brokerstar.confirmResetPassword({
          login: email,
          code: String(code),
          password: String(password),
        });
        toaster.success(t("recover", "passwordchanged"));
      } else {
        await brokerstar.resetPassword({ login: email, onlyCode: true });
        toaster.success(t("recover", "youhaveanemail"));
      }
    } finally {
      loader.hide();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col px-6 py-8">
      <h1 className="mb-8 text-center text-[28px] font-bold tracking-[-0.7px] text-ink">
        {t("recover.passwordforgotten")}
      </h1>

      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Input
          label={t("recover.email")}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="text-center text-[15px] font-medium text-ink-2">
          {t("recover.or")}
        </div>

        <Input
          label={t("recover.newpassword")}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label={t("recover.code")}
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <Button type="submit" fullWidth className="mt-3">
          {t("recover.submit")}
        </Button>
      </form>
    </div>
  );
}
