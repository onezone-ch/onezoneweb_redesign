"use client";

/**
 * Port di login.component: email/password, errore cliccabile, link recover
 * e registrazione (codice consulente fisso, parità con l'originale).
 */

import { useState } from "react";
import Image from "next/image";
import { isset } from "@/lib/helper";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import * as brokerstar from "@/lib/api/brokerstar";
import { setBrokerstarToken } from "@/lib/api/brokerstar";
import { Button, Input } from "@/components/ui";

const REGISTER_CONSULTANT_CODE = "0852221850d5638e4c80b9da870f942b";

export function LoginPage() {
  const { startSession } = useAuth();
  const { t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const login = async () => {
    loader.show();
    try {
      const data = (await brokerstar.login(username, password)) as { token?: string };
      if (isset(data.token)) {
        setBrokerstarToken(data.token as string);
        if (await startSession(data as { token: string })) {
          navigateTo("home");
        }
      }
    } catch (error) {
      console.log(error);
      setErrorMessage(t("login", "LOGIN_STATUS_FAILED"));
    } finally {
      loader.hide();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[420px] flex-col items-center px-6 pb-10">
      <Image
        src="/images/onezone-logo-pos-RGB.svg"
        alt="OneZone"
        width={240}
        height={40}
        className="mb-16 mt-14 h-auto w-2/3"
        priority
      />

      {errorMessage && (
        <button
          type="button"
          onClick={() => setErrorMessage("")}
          className="mb-4 w-full rounded-12 bg-danger-bg px-4 py-3 text-left text-[13.5px] font-medium text-danger"
        >
          {errorMessage}
        </button>
      )}

      <form
        className="flex w-full flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void login();
        }}
      >
        <Input
          label={t("login.email")}
          type="email"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          label={t("login.password")}
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="button"
          onClick={() => navigateTo("recover")}
          className="self-start text-[12.5px] font-medium text-brand underline-offset-2 hover:underline"
        >
          {t("login.remember")}
        </button>

        <Button type="submit" fullWidth className="mt-2">
          {t("login.button")}
        </Button>
      </form>

      <div className="mt-5 text-center text-[12.5px] text-ink-2">
        <span>{t("login.noLogin")} </span>
        <button
          type="button"
          onClick={() => navigateTo(`register/${REGISTER_CONSULTANT_CODE}`)}
          className="font-semibold text-brand underline-offset-2 hover:underline"
        >
          {t("login.register")}
        </button>
      </div>
    </div>
  );
}
