"use client";

/**
 * Port di register.component (489 TS + 584 HTML):
 * - segmented Persona/Azienda;
 * - persona: gender radio (doc 2026-06-24), nome, cognome, indirizzo CH con
 *   autocomplete (CAP→Località→Via, doc 2026-07-13), n. civico, data di nascita;
 * - azienda: Ragione Sociale → name1 (doc 2026-07-09), stesso blocco indirizzo;
 * - comuni: email, mobile, password;
 * - validazione port di checkData (required/invalid con CAP/città/via da API);
 * - violations backend mappate per propertyPath;
 * - modalità link (/link/:contactid): campo relazione, addSubcontact, back();
 * - registrazione: registerUser → login automatico → /policyadd.
 */

import { useState } from "react";
import { isset } from "@/lib/helper";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n, langToNumeric } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import * as brokerstar from "@/lib/api/brokerstar";
import { BrokerstarError, setBrokerstarToken } from "@/lib/api/brokerstar";
import { toaster } from "@/lib/toaster";
import { Button, Input, Segmented } from "@/components/ui";
import { AddressFields } from "@/components/shared/AddressFields";
import { useAddressAutocomplete } from "@/components/shared/useAddressAutocomplete";

// eslint-disable-next-line no-useless-escape
const EMAIL_RE =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[(\d{1,3}\.){3}\d{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

type RegisterType = "person" | "company";

export interface RegisterPageProps {
  consultantCode?: string;
  /** Modalità "aggiungi contatto" da /link/:contactid */
  link?: boolean;
}

export function RegisterPage({ consultantCode = "", link = false }: RegisterPageProps) {
  const { startSession } = useAuth();
  const { lang, t } = useI18n();
  const loader = useLoader();
  const { navigateTo, back } = useNavigator();
  const ac = useAddressAutocomplete();

  const [registerType, setRegisterType] = useState<RegisterType>("person");
  const [data, setData] = useState<Record<string, string>>({});
  const [errorFields, setErrorFields] = useState<Record<string, string>>({});

  const set = (field: string, value: string) =>
    setData((d) => ({ ...d, [field]: value }));

  const hasError = (field: string) => isset(errorFields[field]);
  const getError = (field: string) => errorFields[field] || "";

  /** Port di checkData — stessi messaggi register.required / register.invalid. */
  const checkData = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const required = t("register", "required");
    const invalid = t("register", "invalid");

    if (registerType === "person") {
      if (!isset(data["gender"], true)) errors["gender"] = required;
      if (!isset(data["name1"], true)) errors["name1"] = required;
      if (!isset(data["name2"], true)) errors["name2"] = required;
    } else {
      if (!isset(data["name1"], true)) errors["name1"] = required;
    }

    const plz = ac.values.postCode;
    const city = ac.values.city.trim();
    const address = ac.values.address.trim();

    if (!plz) errors["postCode"] = required;
    else if (!ac.isPlzValid()) errors["postCode"] = invalid;

    if (!city) errors["city"] = required;
    else if (!errors["postCode"] && !ac.isCityValid()) errors["city"] = invalid;

    if (!address) errors["address"] = required;
    else if (!ac.isAddressValid()) errors["address"] = invalid;

    if (!isset(data["address_number"], true)) errors["address_number"] = required;
    if (!isset(data["mail"], true)) errors["mail"] = required;
    if (!isset(data["mobile"], true)) errors["mobile"] = required;
    if (registerType === "person" && !isset(data["birthday"], true)) {
      errors["birthday"] = required;
    }
    if (!isset(data["password"], true)) errors["password"] = required;

    return errors;
  };

  const submit = async () => {
    loader.show();
    const errors = checkData();
    setErrorFields(errors);
    if (Object.keys(errors).length > 0) {
      loader.hide();
      return;
    }

    // ── Payload (port 1:1) ──────────────────────────────────────────────────
    const payload: Record<string, unknown> = {};
    if (registerType === "company") {
      payload["name1"] = isset(data["name1"]) ? data["name1"] : "";
      payload["name2"] = "";
    } else {
      payload["name1"] = isset(data["name1"]) ? data["name1"] : " ";
      payload["name2"] = isset(data["name2"]) ? data["name2"] : " ";
    }

    if (isset(ac.values.address, true)) {
      const num = String(data["address_number"] || "").trim();
      payload["address"] = num ? `${ac.values.address} ${num}` : ac.values.address;
    }
    if (isset(ac.values.postCode, true)) payload["postCode"] = ac.values.postCode;
    if (isset(ac.values.city, true)) payload["city"] = ac.values.city;
    if (isset(data["mobile"], true)) payload["mobile"] = data["mobile"];

    if (isset(data["mail"], true)) {
      if (!EMAIL_RE.test(String(data["mail"]).toLowerCase())) {
        toaster.warn("Ungültige Email");
        setErrorFields((e) => ({ ...e, mail: t("register", "invalid") }));
        loader.hide();
        return;
      }
      payload["mail"] = data["mail"];
      payload["login"] = data["mail"];
    }
    payload["contactType"] = registerType === "company" ? 1 : 2;
    if (isset(data["birthday"], true)) {
      const date = new Date(String(data["birthday"]));
      const day = date.getDate();
      const month = date.getMonth() + 1;
      payload["birthday"] =
        `${date.getFullYear()}-${month < 10 ? "0" : ""}${month}-${day < 10 ? "0" : ""}${day}`;
    }
    if (isset(data["password"], true)) payload["password"] = data["password"];
    if (isset(consultantCode, true)) payload["invitationCode"] = consultantCode;
    if (!link) payload["_sendMail"] = true;

    payload["contactGroup"] = "3";
    payload["country"] = 1;
    payload["language"] = langToNumeric(lang);

    // ── Invio ───────────────────────────────────────────────────────────────
    try {
      if (link) {
        payload["relationContactToCreator"] = data["relationship"];
        await brokerstar.addSubcontact(payload);
        toaster.success(t("profile", "success"));
        back();
      } else {
        await brokerstar.registerUser(payload);
        toaster.success(t("profile", "success"));
        try {
          const loginData = (await brokerstar.login(
            String(data["mail"]),
            String(data["password"]),
          )) as { token?: string };
          if (isset(loginData.token)) {
            setBrokerstarToken(loginData.token as string);
            if (await startSession(loginData as { token: string })) {
              navigateTo("policyadd");
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
    } catch (error) {
      if (error instanceof BrokerstarError) {
        const body = error.body as {
          error?: string;
          violations?: { propertyPath: string; title: string }[];
        };
        if (body?.error) {
          toaster.alert(body.error);
        } else {
          toaster.alert(t("profile", "error"));
        }
        if (body?.violations) {
          setErrorFields((e) => {
            const next = { ...e };
            body.violations!.forEach((v) => {
              next[v.propertyPath] = v.title;
            });
            return next;
          });
        }
      } else {
        toaster.alert(t("profile", "error"));
        console.log(error);
      }
    } finally {
      loader.hide();
    }
  };

  const addressLabels = {
    zip: t("register.zip"),
    city: t("register.city"),
    address: t("register.address"),
  };
  const addressErrors = {
    postCode: getError("postCode"),
    city: getError("city"),
    address: getError("address"),
  };

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col px-6 py-8">
      {!link && (
        <h1 className="mb-6 text-center text-[28px] font-bold tracking-[-0.7px] text-ink">
          {t("register.registeras")}
        </h1>
      )}

      <Segmented<RegisterType>
        fullWidth
        className="mb-6"
        options={[
          { value: "person", label: t("register.headercustomer") },
          { value: "company", label: t("register.headercompany") },
        ]}
        value={registerType}
        onChange={setRegisterType}
      />

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {registerType === "person" ? (
          <>
            {/* Gender radio (doc 2026-06-24) */}
            <div>
              <div className="mb-[7px] text-[12.5px] font-medium tracking-[0.1px] text-muted">
                {t("automation.form_gender")}
              </div>
              <div className="flex gap-6">
                {(
                  [
                    ["m", t("automation.form_gender_male")],
                    ["f", t("automation.form_gender_female")],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="gender"
                      value={value}
                      checked={data["gender"] === value}
                      onChange={() => set("gender", value)}
                      className="h-4 w-4 accent-brand"
                    />
                    <span className="text-[14.5px] text-ink">{label}</span>
                  </label>
                ))}
              </div>
              {hasError("gender") && (
                <p className="mt-[6px] text-[12.5px] font-medium text-danger">
                  {getError("gender")}
                </p>
              )}
              <p className="mt-[6px] text-[12px] text-muted">
                {t("automation.form_gender_hint")}
              </p>
            </div>

            <Input
              label={t("register.firstname")}
              value={data["name1"] || ""}
              error={getError("name1")}
              onChange={(e) => set("name1", e.target.value)}
            />
            <Input
              label={t("register.lastname")}
              value={data["name2"] || ""}
              error={getError("name2")}
              onChange={(e) => set("name2", e.target.value)}
            />
          </>
        ) : (
          <Input
            label={t("register.company")}
            value={data["name1"] || ""}
            error={getError("name1")}
            onChange={(e) => set("name1", e.target.value)}
          />
        )}

        <AddressFields
          ac={ac}
          labels={addressLabels}
          errors={addressErrors}
          addressHint={t("automation.form_address_hint_need_zip_area")}
        />

        <Input
          label={t("automation.form_address_number")}
          value={data["address_number"] || ""}
          error={getError("address_number")}
          onChange={(e) => set("address_number", e.target.value)}
        />

        {registerType === "person" && (
          <Input
            label={t("register.birthday")}
            type="date"
            value={data["birthday"] || ""}
            error={getError("birthday")}
            onChange={(e) => set("birthday", e.target.value)}
          />
        )}

        {link && (
          <Input
            label={t("register.relationship")}
            value={data["relationship"] || ""}
            onChange={(e) => set("relationship", e.target.value)}
          />
        )}

        <Input
          label={t("register.email")}
          type="email"
          autoComplete="email"
          value={data["mail"] || ""}
          error={getError("mail")}
          onChange={(e) => set("mail", e.target.value)}
        />
        <Input
          label={t("register.mobile")}
          type="tel"
          autoComplete="tel"
          value={data["mobile"] || ""}
          error={getError("mobile")}
          onChange={(e) => set("mobile", e.target.value)}
        />
        <Input
          label={t("register.password")}
          type="password"
          autoComplete="new-password"
          value={data["password"] || ""}
          error={getError("password")}
          onChange={(e) => set("password", e.target.value)}
        />

        <Button type="submit" fullWidth className="mt-3">
          {t(!link ? "register.button" : "register.addcontact")}
        </Button>
      </form>
    </div>
  );
}
