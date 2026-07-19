"use client";

/**
 * Port di automation-setup.component (/automation-setup) — wizard 3 step:
 * ① credenziali EcoHub + n. provvigione → ② QR TOTP (paste/click, preview,
 * extract-totp-secret multipart) → ③ istruzioni Google Authenticator.
 * Submit: registerConsultant (409 = già registrato → ok) → updateConsultant
 * credentials → checkLogin con timeout 90s → success → /automation-form;
 * fallimento → reset a step 1 (parità).
 */

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { Button, Card, Input, Spinner, StepBar } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useNavigator } from "@/lib/navigation";
import { storage } from "@/lib/storage";
import * as automation from "@/lib/api/automation";
import { AutomationError } from "@/lib/api/automation";
import { toaster } from "@/lib/toaster";

export function AutomationSetupPage() {
  const { userData } = useAuth();
  const { t } = useI18n();
  const { navigateTo } = useNavigator();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [totpError, setTotpError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ecohub_username: "",
    ecohub_password: "",
    ecohub_totp_secret: "",
    commission_number: "",
  });
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const contact = userData?.contact;
    setUserName(contact ? `${contact.name2 ?? ""} ${contact.name1 ?? ""}`.trim() : "");
  }, [userData]);

  const set = (field: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const canProceed = (): boolean => {
    if (currentStep === 1) {
      return !!form.ecohub_username && !!form.ecohub_password && !!form.commission_number;
    }
    if (currentStep === 2) return !!qrFile;
    return true;
  };

  const readQrFile = (file: File) => {
    setQrFile(file);
    setTotpError(null);
    const reader = new FileReader();
    reader.onload = (e) => setQrPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onQrPaste = (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) readQrFile(file);
        break;
      }
    }
  };

  const extractTotp = async () => {
    if (!qrFile) {
      setTotpError("Incolla prima il QR Code.");
      return;
    }
    setIsLoading(true);
    setTotpError(null);
    try {
      const result = await automation.extractTotp(qrFile);
      set("ecohub_totp_secret", result.secret);
      setCurrentStep(3);
    } catch {
      setTotpError("Impossibile estrarre il TOTP. Verifica che l'immagine sia corretta.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = async () => {
    if (currentStep === 2) {
      await extractTotp();
      return;
    }
    setCurrentStep((s) => s + 1);
  };

  const resetToStep1 = () => {
    setCurrentStep(1);
    setQrPreview(null);
    setQrFile(null);
    setTotpError(null);
    setForm((f) => ({ ...f, ecohub_totp_secret: "" }));
  };

  const onSubmit = async () => {
    const contact = userData?.contact;
    const consultantId = String(contact?.id ?? "");
    setIsLoading(true);
    try {
      // 1. registra il consulente (409 = già registrato → prosegui)
      if (!automation.hasConsultantApiKey()) {
        try {
          await automation.registerConsultant({
            onezone_id: consultantId,
            name: String(contact?.name2 ?? ""),
            surname: String(contact?.name1 ?? ""),
            ecohub_username: form.ecohub_username,
            ecohub_password: form.ecohub_password,
            ecohub_totp_secret: form.ecohub_totp_secret,
            commission_number: form.commission_number || undefined,
          });
        } catch (err) {
          if (!(err instanceof AutomationError) || err.status !== 409) {
            throw err;
          }
        }
      }

      // 2. aggiorna le credenziali
      const result = await automation.updateConsultant({
        consultant_id: consultantId,
        ecohub_username: form.ecohub_username,
        ecohub_password: form.ecohub_password,
        ecohub_totp_secret: form.ecohub_totp_secret,
      });
      if (result.status !== "updated") {
        toaster.warn("Si è verificato un errore. Riprova più tardi.");
        return;
      }

      // 3. verifica login EcoHub (~90s)
      setIsVerifying(true);
      try {
        const loginResult = await Promise.race([
          automation.checkLogin(consultantId),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 90000)),
        ]);
        if (loginResult.login_check) {
          try {
            const consultant = await automation.getConsultant(consultantId);
            storage.setItem("consultantData", JSON.stringify(consultant));
          } catch {
            /* cache non bloccante */
          }
          toaster.success("Setup completato con successo!");
          navigateTo("automation-form");
        } else {
          toaster.warn(
            "Login su EcoHub FALLITO. Ripetere la procedura. Se il problema persiste, contattare il webmaster.",
          );
          resetToStep1();
        }
      } catch {
        toaster.warn(
          "Login su EcoHub FALLITO. Ripetere la procedura. Se il problema persiste, contattare il webmaster.",
        );
        resetToStep1();
      } finally {
        setIsVerifying(false);
      }
    } catch {
      toaster.warn("Si è verificato un errore. Riprova più tardi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-5 px-5 py-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-[-0.7px] text-ink">
          {t("automation.setup_title")}
        </h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">
          {t("automation.setup_welcome_pre")} <strong>{userName}</strong>
          {t("automation.setup_welcome_post")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <StepBar steps={3} current={currentStep - 1} />
        <span className="text-[12.5px] text-muted">
          {t("automation.step_label")} {currentStep} {t("automation.step_of")} 3
        </span>
      </div>

      {/* Step 1 — Credenziali */}
      {currentStep === 1 && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-[18px] font-bold tracking-[-0.4px] text-ink">
            {t("automation.step_credenziali")}
          </h2>
          <Input
            label={t("automation.username_label")}
            placeholder={t("automation.username_placeholder")}
            value={form.ecohub_username}
            onChange={(e) => set("ecohub_username", e.target.value)}
          />
          <Input
            label={t("automation.password_label")}
            type="password"
            placeholder={t("automation.password_placeholder")}
            value={form.ecohub_password}
            onChange={(e) => set("ecohub_password", e.target.value)}
          />
          <div>
            <Input
              label={t("automation.commission_label")}
              value={form.commission_number}
              onChange={(e) => set("commission_number", e.target.value)}
            />
            <p className="mt-1 text-[12px] text-muted">{t("automation.commission_hint")}</p>
          </div>
        </Card>
      )}

      {/* Step 2 — QR Code */}
      {currentStep === 2 && (
        <Card className="flex flex-col gap-4">
          <h2 className="text-[18px] font-bold tracking-[-0.4px] text-ink">
            {t("automation.step_qrcode")}
          </h2>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-[13.5px] text-ink-2">
            <li>{t("automation.step2_instruction_1")}</li>
            <li>{t("automation.step2_instruction_2")}</li>
            <li dangerouslySetInnerHTML={{ __html: t("automation.step2_instruction_3") }} />
            <li>{t("automation.step2_instruction_4")}</li>
            <li>{t("automation.step2_instruction_5")}</li>
          </ol>
          <div className="rounded-14 bg-warn-bg p-3 text-[12.5px] text-warn">
            <strong>{t("automation.step2_note_title")}</strong>{" "}
            {t("automation.step2_note_text")}
          </div>

          <label
            tabIndex={0}
            onPaste={onQrPaste}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-14 border border-dashed border-border bg-tint-2 p-6 text-center transition-colors focus-within:border-brand hover:bg-tint"
          >
            {qrPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrPreview} alt="QR preview" className="max-h-40 rounded-10" />
            ) : (
              <p className="text-[12.5px] text-muted">
                {t("automation.qr_paste_hint")}
                <br />
                {t("automation.qr_paste_or_click")}
              </p>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) readQrFile(f);
              }}
            />
          </label>
          {totpError && (
            <p className="text-[12.5px] font-medium text-danger">{totpError}</p>
          )}
        </Card>
      )}

      {/* Step 3 — Authenticator */}
      {currentStep === 3 && (
        <Card className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-14 bg-success-bg p-3 text-[13px] font-medium text-success">
            <Check size={16} strokeWidth={2} />
            {t("automation.totp_success")}
          </div>
          <h2 className="text-[18px] font-bold tracking-[-0.4px] text-ink">
            {t("automation.step_authenticator")}
          </h2>
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-[13.5px] text-ink-2">
            <li dangerouslySetInnerHTML={{ __html: t("automation.step3_instruction_1") }} />
            <li>{t("automation.step3_instruction_2")}</li>
            <li>{t("automation.step3_instruction_3")}</li>
            <li>{t("automation.step3_instruction_4")}</li>
            <li dangerouslySetInnerHTML={{ __html: t("automation.step3_instruction_5") }} />
          </ol>
          <div className="rounded-14 bg-warn-bg p-3 text-[12.5px] text-warn">
            <strong>{t("automation.step3_warning_title")}</strong>{" "}
            {t("automation.step3_warning_text")}
          </div>
        </Card>
      )}

      {/* Verifica in corso */}
      {isVerifying && (
        <Card className="flex items-center gap-3 bg-tint-2">
          <Spinner />
          <p className="text-[13.5px] font-medium text-ink-2">
            {t("automation.verifying_message")}
            <br />
            {t("automation.verifying_wait")}
          </p>
        </Card>
      )}

      {/* Navigazione wizard */}
      <div className="flex justify-between gap-3">
        {currentStep > 1 ? (
          <Button
            variant="secondary"
            onClick={() => setCurrentStep((s) => s - 1)}
            disabled={isLoading || isVerifying}
          >
            {t("automation.indietro")}
          </Button>
        ) : (
          <span />
        )}
        {currentStep < 3 ? (
          <Button onClick={() => void nextStep()} disabled={!canProceed() || isLoading}>
            {isLoading ? t("automation.loading_text") : t("automation.avanti")}
          </Button>
        ) : (
          <Button onClick={() => void onSubmit()} disabled={isLoading || isVerifying}>
            {isLoading || isVerifying
              ? t("automation.submitting_text")
              : t("automation.invia")}
          </Button>
        )}
      </div>
    </div>
  );
}
