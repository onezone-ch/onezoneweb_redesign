"use client";

/**
 * Port di automation-form.component (/automation-form + rotta pubblica
 * /automation-form-generic-client): il form preventivi auto completo.
 * - publicMode: query ?lang= forza la lingua; recipient_email dal form;
 *   submit via /api/automation/public/* (chiave risolta server-side);
 * - modalità consulente: recipient_email = ecohub_username da consultantData,
 *   scrapers filtrati per consultantDisabledScrapers;
 * - sezioni: tipo richiesta, dati personali (+sub-form conducente principale),
 *   veicolo 1, veicolo 2 (targhe trasferibili), uso/coperture (+EV),
 *   storico sinistri 5/3 anni, altre domande, scrapers, submit;
 * - validazione: formState.validateForm (port dei Validators Angular);
 * - bottone dev "riempi dati di test" solo fuori produzione (parità).
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button, Card, Input, Select } from "@/components/ui";
import { AddressFields } from "@/components/shared/AddressFields";
import { useAddressAutocomplete } from "@/components/shared/useAddressAutocomplete";
import { useI18n, LANGUAGES, type Language } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { storage } from "@/lib/storage";
import { publicConfig } from "@/lib/config";
import * as automation from "@/lib/api/automation";
import { AutomationError } from "@/lib/api/automation";
import type { QuoteRequestPayload } from "@/lib/api/automation.types";
import { toaster } from "@/lib/toaster";
import * as opt from "./options";
import {
  INITIAL_VALUES,
  showVehicle2,
  showCompanyName,
  showForeignersId,
  showMainDriverForeignersId,
  showDeductibleTotal,
  showDeductiblePartial,
  showDeductibleParking,
  showMainDriverFields,
  showLeasingCompany1,
  showLeasingCompany2,
  isRegistrationOnly,
  isOfferAndRegistration,
  showRegistrationScraper,
  showSubmitVehicleProof,
  showScrapersSection,
  validateForm,
  type FormValues,
  type FormErrors,
} from "./formState";
import { formatDateInput, formatMonthYearInput } from "./validators";
import { VehicleSearchModal, type VehicleSelection } from "./VehicleSearchModal";
import { N_CERT_RE, SERIAL_RE, isObviousSerial } from "./validators";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Definiti a livello di modulo: se dichiarati dentro AutomationFormPage la loro
// identità cambia a ogni render e React rimonta il sottoalbero (gli input perdono il focus).
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="flex flex-col gap-4">
    <h2 className="text-[18px] font-bold tracking-[-0.4px] text-ink">{title}</h2>
    {children}
  </Card>
);

const Hint = ({ text }: { text: string }) => (
  <p className="-mt-3 text-[12px] text-muted">{text}</p>
);

function useOnce(fn: () => void) {
  const done = useRef(false);
  if (!done.current) {
    done.current = true;
    fn();
  }
}

export function AutomationFormPage({ publicMode = false }: { publicMode?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const loader = useLoader();
  const searchParams = useSearchParams();

  // Modalità pubblica: ?lang= forza la lingua (senza reload: context React)
  useOnce(() => {
    if (!publicMode) return;
    const langParam = (searchParams.get("lang") || "").toLowerCase();
    if (LANGUAGES.includes(langParam as Language) && langParam !== storage.getItem("selectedLanguage")) {
      setLang(langParam as Language);
    }
  });

  // Scrapers disponibili (env meno disabled del consulente; tutti in pubblico)
  const availableScrapers = useMemo(() => {
    if (publicMode) return [...publicConfig.automationScrapers];
    let disabled: string[] = [];
    try {
      const parsed = JSON.parse(storage.getItem("consultantDisabledScrapers") || "[]");
      if (Array.isArray(parsed)) disabled = parsed.map((s: string) => String(s).toLowerCase());
    } catch {
      disabled = [];
    }
    return publicConfig.automationScrapers.filter((s) => !disabled.includes(s.toLowerCase()));
  }, [publicMode]);

  const [values, setValues] = useState<FormValues>(() => ({
    ...INITIAL_VALUES,
    scrapers: [...availableScrapers],
  }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [submitErrorHtml, setSubmitErrorHtml] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const modalVehicleIndex = useRef<1 | 2>(1);

  // Autocomplete indirizzo principale (imposta anche il cantone, parità selectPlz)
  const ac = useAddressAutocomplete({
    onSelectLocality: (entry) => set("canton", entry.canton),
  });
  // Autocomplete conducente principale
  const mdAc = useAddressAutocomplete({
    onSelectLocality: (entry) => setMd("canton", entry.canton),
  });

  const touch = (field: string) => setTouched((tc) => ({ ...tc, [field]: true }));

  /** setter con i side-effect condizionali di setupConditionalFields */
  const set = useCallback(
    <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
      setValues((v) => {
        const next = { ...v, [field]: value };
        if (field === "gender") {
          if (value === "Company") {
            next.first_name = "";
            next.last_name = "";
            next.birth_date = "";
            next.first_driving_license_date = "";
          } else {
            next.company_name = "";
            if (next.main_driver_type === "multiple") next.main_driver_type = "user";
          }
        }
        if (field === "nationality" && String(value).toUpperCase() === "CH") {
          next.foreigners_id_type = "";
        }
        if ((field === "leasing_1" || field === "leasing_2") && value === "Yes") {
          next.comprehensive_insurance = "Full";
        }
        if (field === "parking_damage_coverage" && value === "No") {
          next.deductible_parking_damage = "";
        }
        if (field === "request_type") {
          // port di applyRequestTypeValidators (reset dei valori)
          if (value === "Nur Nachweis bestellen") {
            next.scrapers = [];
            next.submit_vehicle_proof_1 = "";
            next.submit_vehicle_proof_2 = "";
          } else if (value === "Offerte und Nachweis nur von dieser Versicherung") {
            next.scrapers = [];
          } else {
            next.registration_scraper = "";
            if (next.scrapers.length === 0) next.scrapers = [...availableScrapers];
          }
        }
        return next;
      });
      touch(String(field));
    },
    [availableScrapers],
  );

  const setMd = useCallback((field: string, value: string) => {
    setValues((v) => {
      const next = { ...v, main_driver: { ...v.main_driver, [field]: value } };
      if (field === "nationality" && value.toUpperCase() === "CH") {
        next.main_driver.foreigners_id_type = "";
      }
      return next;
    });
    touch(`main_driver.${field}`);
  }, []);

  // ── Errori (validazione live sui touched + submit) ───────────────────────
  const currentErrors = useMemo(() => {
    return validateForm(
      { ...values, zip_code: ac.values.postCode, area: ac.values.city, address: ac.values.address,
        main_driver: { ...values.main_driver, zip_code: mdAc.values.postCode, area: mdAc.values.city, address: mdAc.values.address } },
      publicMode,
      { plzValid: ac.isPlzValid(), areaValid: ac.isCityValid(), addressValid: ac.isAddressValid() },
      { plzValid: mdAc.isPlzValid(), areaValid: mdAc.isCityValid(), addressValid: mdAc.isAddressValid() },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, ac.values, mdAc.values, ac.cacheVersion, mdAc.cacheVersion, publicMode]);

  const errorLabel = (code: string, field: string): string => {
    switch (code) {
      case "required":
        return t("automation", "form_err_required");
      case "plzNotFound":
        return t("automation", "form_err_zip_not_found");
      case "areaNotFound":
        return t("automation", "form_err_area_not_found");
      case "addressNotFromApi":
        return t("automation", "form_err_address_not_found");
      case "email":
        return t("automation", "form_err_email");
      case "emailPlus":
        return t("automation", "form_err_email_no_plus");
      case "obviousSerial":
        return t("automation", "form_serial_number_obvious_error");
      case "minAge":
        return t("automation", "form_err_min_age_18");
      case "minArrayLength":
        return t("automation", "scrapers_required");
      case "pattern": {
        if (field.includes("date") || field.includes("birth"))
          return t("automation", "form_err_date_format");
        if (field.startsWith("n_certificate"))
          return t("automation", "form_n_certificate_error");
        if (field.startsWith("serial_number"))
          return t("automation", "form_serial_number_error");
        return t("automation", "form_err_invalid_format");
      }
      default:
        return t("automation", "form_err_invalid_value");
    }
  };

  const err = (field: string): string => {
    const code = (submitted ? currentErrors : errors)[field];
    if (!code) return "";
    if (!submitted && !touched[field]) return "";
    return errorLabel(code, field);
  };
  // errors sync per la visualizzazione live sui touched
  if (errors !== currentErrors) {
    // aggiorna senza re-render loop: solo se cambia il contenuto
    const a = JSON.stringify(errors);
    const b = JSON.stringify(currentErrors);
    if (a !== b) setErrors(currentErrors);
  }

  // ── Selezione veicolo dal modal (port di selectVehicleResult) ────────────
  const onVehicleSelect = ({ result, searchType, serialQuery }: VehicleSelection) => {
    const idx = modalVehicleIndex.current;
    const typeApproval = (result.type_approval ?? "").trim();
    const serialOk = SERIAL_RE.test(serialQuery) && !isObviousSerial(serialQuery);
    setValues((v) => ({
      ...v,
      [`car_brand_${idx}`]: result.make,
      [`car_model_${idx}`]: result.commercial_name,
      [`n_certificate_${idx}`]: N_CERT_RE.test(typeApproval) ? typeApproval : "",
      ...(searchType === "matricule"
        ? { [`serial_number_${idx}`]: serialOk ? serialQuery : "" }
        : {}),
    }));
    setModalOpen(false);
  };

  const openVehicleModal = (idx: 1 | 2) => {
    modalVehicleIndex.current = idx;
    setValues((v) => ({
      ...v,
      [`car_brand_${idx}`]: "",
      [`car_model_${idx}`]: "",
      [`n_certificate_${idx}`]: "",
      [`serial_number_${idx}`]: "",
    }));
    setModalOpen(true);
  };

  // ── Submit (port di onSubmit) ────────────────────────────────────────────
  const resolveRecipientEmail = (formEmail: string): string => {
    if (publicMode) {
      const v = values.recipient_email.trim();
      return v || formEmail;
    }
    try {
      const cached = storage.getItem("consultantData");
      if (cached) {
        const u = (JSON.parse(cached)?.ecohub_username || "").toString().trim();
        if (u) return u;
      }
    } catch {
      /* ignore */
    }
    return formEmail;
  };

  const escapeHtml = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

  const extractBackendErrorMessage = (error: unknown): string | null => {
    if (!(error instanceof AutomationError)) return null;
    const header = `<strong>HTTP ${error.status}</strong>`;
    const body = error.body as { detail?: unknown } | string | undefined;
    if (!body) return header;
    const detail = typeof body === "object" ? body.detail : undefined;
    if (typeof detail === "string") return `${header}<br>${escapeHtml(detail)}`;
    if (Array.isArray(detail)) {
      const lines = detail.map((d: { loc?: unknown[]; msg?: string; type?: string }) => {
        const loc = Array.isArray(d.loc) ? d.loc.filter((x) => x !== "body").join(".") : "";
        return `<li>${loc ? "<code>" + escapeHtml(loc) + "</code>: " : ""}${escapeHtml(d.msg || "")}${d.type ? " <em>[" + escapeHtml(d.type) + "]</em>" : ""}</li>`;
      });
      return `${header} — Validation error:<ul class="list-disc pl-5 mt-1">${lines.join("")}</ul>`;
    }
    if (typeof body === "string") return `${header}<br>${escapeHtml(body)}`;
    try {
      return `${header}<pre class="whitespace-pre-wrap text-xs mt-1">${escapeHtml(JSON.stringify(body, null, 2))}</pre>`;
    } catch {
      return header;
    }
  };

  const onSubmit = async () => {
    setSubmitted(true);
    setSubmitErrorHtml(null);

    const merged: FormValues = {
      ...values,
      zip_code: ac.values.postCode,
      area: ac.values.city,
      address: ac.values.address,
      main_driver: {
        ...values.main_driver,
        zip_code: mdAc.values.postCode,
        area: mdAc.values.city,
        address: mdAc.values.address,
      },
    };
    const validationErrors = validateForm(
      merged,
      publicMode,
      { plzValid: ac.isPlzValid(), areaValid: ac.isCityValid(), addressValid: ac.isAddressValid() },
      { plzValid: mdAc.isPlzValid(), areaValid: mdAc.isCityValid(), addressValid: mdAc.isAddressValid() },
    );
    if (Object.keys(validationErrors).length > 0) {
      toaster.warn(t("automation", "form_err_fill_required"));
      return;
    }

    const {
      ev_charging_station,
      ev_high_voltage_battery,
      ev_cyber_protection,
      ev_charging_cards_apps,
      other_q_terminated,
      other_q_refused,
      other_q_license_suspension,
      main_driver_type,
      main_driver,
      request_type,
      registration_scraper,
      submit_vehicle_proof_1,
      submit_vehicle_proof_2,
      scrapers,
      ...rest
    } = merged;

    const otherQuestions: string[] = [];
    if (other_q_terminated) otherQuestions.push(t("automation", "form_other_q_terminated"));
    if (other_q_refused) otherQuestions.push(t("automation", "form_other_q_refused"));
    const recipientEmail = resolveRecipientEmail(rest.email);

    const payload: Record<string, unknown> = {
      ...rest,
      request_type,
      recipient_email: recipientEmail,
      electric_vehicle: {
        charging_station_and_accessories: !!ev_charging_station,
        high_voltage_batteries: !!ev_high_voltage_battery,
        cyber_protection: !!ev_cyber_protection,
        charging_cards_and_app_protection: !!ev_charging_cards_apps,
      },
      other_questions: otherQuestions.join(", "),
      source: publicMode ? "onezone_cliente" : "onezone_consulente",
    };
    if (other_q_license_suspension && other_q_license_suspension !== "none") {
      payload["license_withdrawal_5_years"] = other_q_license_suspension;
    }

    if (isRegistrationOnly(merged)) {
      payload["registration_scraper"] = registration_scraper;
      payload["registration_only"] = true;
    } else if (isOfferAndRegistration(merged)) {
      payload["registration_scraper"] = registration_scraper;
      payload["registration_only"] = false;
      if (submit_vehicle_proof_1) payload["submit_vehicle_proof_1"] = submit_vehicle_proof_1;
      if (showVehicle2(merged) && submit_vehicle_proof_2)
        payload["submit_vehicle_proof_2"] = submit_vehicle_proof_2;
    } else {
      payload["scrapers"] = scrapers;
      if (submit_vehicle_proof_1) payload["submit_vehicle_proof_1"] = submit_vehicle_proof_1;
      if (showVehicle2(merged) && submit_vehicle_proof_2)
        payload["submit_vehicle_proof_2"] = submit_vehicle_proof_2;
    }

    if (main_driver_type === "other") {
      const driverData: Record<string, unknown> = {};
      Object.entries(main_driver || {}).forEach(([k, v]) => {
        if (v !== "" && v !== null && v !== undefined) driverData[k] = v;
      });
      payload["main_driver"] = { driver_type: "other", driver: driverData };
    } else if (main_driver_type === "multiple") {
      payload["main_driver"] = { driver_type: "multiple" };
    }

    loader.show();
    try {
      await automation.submitQuoteRequest(payload as unknown as QuoteRequestPayload, publicMode);
      setSubmittedEmail(recipientEmail);
      setSubmitSuccess(true);
    } catch (error) {
      const backendMsg = extractBackendErrorMessage(error);
      setSubmitErrorHtml(backendMsg);
      if (error instanceof AutomationError && error.status === 429 && !backendMsg) {
        toaster.warn(t("automation", "error_pool_full"));
      } else if (backendMsg) {
        toaster.warn(
          `Errore backend (HTTP ${error instanceof AutomationError ? error.status : "?"}) — vedi dettagli sopra il form`,
        );
        try {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } catch {
          /* noop */
        }
      } else {
        toaster.warn(t("automation", "error_generic"));
      }
    } finally {
      loader.hide();
    }
  };

  // ── fillTestData (solo dev, parità) ──────────────────────────────────────
  const fillTestData = () => {
    setValues((v) => ({
      ...v,
      gender: "Company",
      company_name: "Galy Inhaber Claret",
      email: "d.sgamba@hotmail.it",
      phone: "0798541611",
      nationality: "CH",
      language: "de",
      main_driver_type: "multiple",
      deductible_under_26: "1000",
      n_certificate_1: "3FD888",
      car_brand_1: "FIAT",
      car_model_1: "FIAT Ducato 2.2 MJ",
      serial_number_1: "233566755",
      canton: "BE",
      first_registration_date_1: "13.12.2022",
      leasing_1: "No",
      garage_parking_1: "No",
      interchangeable_plate: "No",
      kilometers_per_year_1: "15000",
      vehicle_usage: "rental",
      civil_insurance: "Yes excluding my property",
      comprehensive_insurance: "Partial",
      deductible_partial_insurance: "0",
      personal_belongings_coverage: "No",
      roadside_assistance: "No",
      garage_free_choice: "free_choice",
      payment_mode: "Semiannual",
      current_insurance: "Zürich",
      recipient_email: "marko.petric@versicherungs-broker.ch",
      scrapers: [...availableScrapers],
      request_type: "Vergleich Versicherungsangebote",
    }));
    void ac.onPlzInput("2503");
    toaster.success(t("automation", "form_test_loaded"));
  };

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitSuccess) {
    return (
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-4 px-6 py-16 text-center">
        <h1 className="text-[28px] font-bold tracking-[-0.7px] text-ink">
          {t("automation.form_success_title")}
        </h1>
        <p className="text-[14px] leading-relaxed text-ink-2">
          {t("automation", "form_success_message").replace("{email}", submittedEmail)}
        </p>
      </div>
    );
  }

  const yesNo = [
    { value: "Yes", label: t("automation.form_yes") },
    { value: "No", label: t("automation.form_no") },
  ];

  const sel = (options: { value: string; label: string }[], translate = true) =>
    options.map((o) => (
      <option key={o.value} value={o.value}>
        {translate && o.label.startsWith("automation.") ? t(o.label) : o.label}
      </option>
    ));

  const vehicleSection = (idx: 1 | 2) => {
    const g = (name: string) => `${name}_${idx}` as keyof FormValues;
    const suffix = idx === 2 ? "_v2" : "";
    return (
      <>
        <Button
          variant="ghost"
          icon={<Search size={16} strokeWidth={1.6} />}
          onClick={() => openVehicleModal(idx)}
        >
          {t("automation.vehicle_search_btn")}
        </Button>
        <Input
          label={t(`automation.form_brand${suffix}`)}
          value={String(values[g("car_brand")] ?? "")}
          error={err(`car_brand_${idx}`)}
          onChange={(e) => set(g("car_brand"), e.target.value)}
        />
        <Input
          label={t(`automation.form_model${suffix}`)}
          value={String(values[g("car_model")] ?? "")}
          error={err(`car_model_${idx}`)}
          onChange={(e) => set(g("car_model"), e.target.value)}
        />
        <Input
          label={t(`automation.form_n_certificate${suffix}`)}
          value={String(values[g("n_certificate")] ?? "")}
          error={err(`n_certificate_${idx}`)}
          onChange={(e) => set(g("n_certificate"), e.target.value)}
        />
        <Hint text={t(`automation.form_n_certificate${suffix || ""}_hint`)} />
        <Input
          label={t(`automation.form_serial_number${suffix}`)}
          value={String(values[g("serial_number")] ?? "")}
          error={err(`serial_number_${idx}`)}
          inputMode="numeric"
          maxLength={9}
          onChange={(e) => set(g("serial_number"), e.target.value)}
        />
        <Hint text={t(`automation.form_serial_number${suffix || ""}_hint`)} />
        <Input
          label={t(`automation.form_accessories${suffix}`)}
          value={String(values[g("accessories")] ?? "")}
          inputMode="numeric"
          onChange={(e) => set(g("accessories"), e.target.value)}
        />
        <Hint text={t(`automation.form_accessories${suffix || ""}_hint`)} />
        {idx === 1 && (
          <>
            <Select
              label={t("automation.form_canton")}
              value={values.canton}
              error={err("canton")}
              onChange={(e) => set("canton", e.target.value)}
            >
              {sel(opt.cantonOptions, false)}
            </Select>
            <Input
              label={t("automation.form_license_plate")}
              value={values.license_plate}
              onChange={(e) => set("license_plate", e.target.value)}
            />
            <Hint text={t("automation.form_license_plate_hint")} />
          </>
        )}
        <Input
          label={t(`automation.form_first_registration${suffix}`)}
          placeholder={t("automation.form_date_placeholder")}
          value={String(values[g("first_registration_date")] ?? "")}
          error={err(`first_registration_date_${idx}`)}
          onChange={(e) => {
            const ev = e.nativeEvent as InputEvent;
            set(
              g("first_registration_date"),
              formatDateInput(e.target.value, ev.inputType === "deleteContentBackward"),
            );
          }}
        />
        <Hint text={t(`automation.form_first_registration${suffix || ""}_hint`)} />
        <Select
          label={t(`automation.form_leasing${suffix}`)}
          value={String(values[g("leasing")] ?? "No")}
          onChange={(e) => set(g("leasing"), e.target.value)}
        >
          {yesNo.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        {((idx === 1 && showLeasingCompany1(values)) ||
          (idx === 2 && showLeasingCompany2(values))) && (
          <Select
            label={t("automation.form_leasing_company")}
            value={String(values[g("leasing_company")] ?? "")}
            onChange={(e) => set(g("leasing_company"), e.target.value)}
          >
            <option value="">{t("automation.form_select_placeholder")}</option>
            {opt.leasingCompanyOptions.map((c: string) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}
        <Select
          label={t(`automation.form_garage_parking${suffix}`)}
          value={String(values[g("garage_parking")] ?? "Yes")}
          onChange={(e) => set(g("garage_parking"), e.target.value)}
        >
          {yesNo.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Hint text={t(`automation.form_garage${idx === 2 ? "_v2" : ""}_hint`)} />
        <Select
          label={t("automation.form_vehicle_type")}
          value={String(values[g("vehicle_type")] ?? "")}
          onChange={(e) => set(g("vehicle_type"), e.target.value)}
        >
          {sel(opt.vehicleTypeOptions)}
        </Select>
        <Select
          label={t("automation.form_drive")}
          value={String(values[g("drive")] ?? "")}
          onChange={(e) => set(g("drive"), e.target.value)}
        >
          {sel(opt.driveOptions)}
        </Select>
        <Input
          label={t("automation.form_purchase_date")}
          placeholder={t("automation.form_month_year_placeholder")}
          value={String(values[g("purchase_date")] ?? "")}
          error={err(`purchase_date_${idx}`)}
          onChange={(e) => {
            const ev = e.nativeEvent as InputEvent;
            set(
              g("purchase_date"),
              formatMonthYearInput(e.target.value, ev.inputType === "deleteContentBackward"),
            );
          }}
        />
        <Select
          label={t("automation.form_km_per_year")}
          value={String(values[g("kilometers_per_year")] ?? "")}
          onChange={(e) => set(g("kilometers_per_year"), e.target.value)}
        >
          {sel(opt.kmPerYearOptions)}
        </Select>
        <Input
          label={t("automation.form_current_mileage")}
          value={String(values[g("current_mileage")] ?? "")}
          inputMode="numeric"
          onChange={(e) => set(g("current_mileage"), e.target.value)}
        />
        <Select
          label={t("automation.form_reason_redemption")}
          value={String(values[g("reasons_for_redemption")] ?? "")}
          onChange={(e) => set(g("reasons_for_redemption"), e.target.value)}
        >
          {sel(opt.reasonsForRedemptionOptions)}
        </Select>
        {showSubmitVehicleProof(values) && (
          <Select
            label={t("automation.form_submit_vehicle_proof")}
            value={String(values[g("submit_vehicle_proof")] ?? "")}
            error={err(`submit_vehicle_proof_${idx}`)}
            onChange={(e) => set(g("submit_vehicle_proof"), e.target.value)}
          >
            {sel(opt.submitVehicleProofOptions)}
          </Select>
        )}
      </>
    );
  };

  const claimsRow = (field: keyof FormValues, labelKey: string) => (
    <Select
      key={field}
      label={t(labelKey)}
      value={String(values[field] ?? "0")}
      error={err(String(field))}
      onChange={(e) => set(field, e.target.value as never)}
    >
      <option value="0">{t("automation.form_claims_none")}</option>
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">{t("automation.form_claims_3_or_more")}</option>
    </Select>
  );

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-5 py-6">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-[28px] font-bold tracking-[-0.7px] text-ink">
          {t("automation.form_title")}
        </h1>
        {!IS_PRODUCTION && (
          <Button size="sm" variant="ghost" onClick={fillTestData}>
            {t("automation.form_test_button")}
          </Button>
        )}
      </div>

      {submitErrorHtml && (
        <div
          className="rounded-14 bg-danger-bg p-4 text-[13px] text-danger"
          dangerouslySetInnerHTML={{ __html: submitErrorHtml }}
        />
      )}

      {/* Tipo richiesta (doc 2026-06-22) */}
      <Card className="flex flex-col gap-3">
        <div className="text-[15px] font-semibold text-ink">
          {t("automation.form_request_type")}
        </div>
        {(
          [
            ["Nur Nachweis bestellen", "automation.form_request_type_opt1"],
            ["Vergleich Versicherungsangebote", "automation.form_request_type_opt2"],
            ["Offerte und Nachweis nur von dieser Versicherung", "automation.form_request_type_opt3"],
          ] as const
        ).map(([value, labelKey]) => (
          <label key={value} className="flex cursor-pointer items-start gap-2">
            <input
              type="radio"
              name="request_type"
              checked={values.request_type === value}
              onChange={() => set("request_type", value)}
              className="mt-1 h-4 w-4 accent-brand"
            />
            <span className="text-[14px] text-ink">{t(labelKey)}</span>
          </label>
        ))}
        {showRegistrationScraper(values) && (
          <Select
            label={t("automation.form_registration_scraper")}
            value={values.registration_scraper}
            error={err("registration_scraper")}
            onChange={(e) => set("registration_scraper", e.target.value)}
          >
            <option value="">{t("automation.form_select_placeholder")}</option>
            {opt.registrationScraperOptions.map((s: string) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        )}
      </Card>

      {/* Sezione 1 — Dati personali */}
      <Section title={t("automation.form_section_personal")}>
        <div>
          <div className="mb-[7px] text-[12.5px] font-medium tracking-[0.1px] text-muted">
            {t("automation.form_gender")}
          </div>
          <div className="flex flex-wrap gap-5">
            {(
              [
                ["Male", "automation.form_gender_male"],
                ["Female", "automation.form_gender_female"],
                ["Company", "automation.form_gender_company"],
              ] as const
            ).map(([value, labelKey]) => (
              <label key={value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  checked={values.gender === value}
                  onChange={() => set("gender", value)}
                  className="h-4 w-4 accent-brand"
                />
                <span className="text-[14.5px] text-ink">{t(labelKey)}</span>
              </label>
            ))}
          </div>
          <p className="mt-[6px] text-[12px] text-muted">{t("automation.form_gender_hint")}</p>
        </div>

        {showCompanyName(values) ? (
          <>
            <Input
              label={t("automation.form_company")}
              value={values.company_name}
              error={err("company_name")}
              onChange={(e) => set("company_name", e.target.value)}
            />
            <Hint text={t("automation.form_company_hint")} />
          </>
        ) : (
          <>
            <Input
              label={t("automation.form_first_name")}
              value={values.first_name}
              error={err("first_name")}
              onChange={(e) => set("first_name", e.target.value)}
            />
            <Hint text={t("automation.form_first_name_hint")} />
            <Input
              label={t("automation.form_last_name")}
              value={values.last_name}
              error={err("last_name")}
              onChange={(e) => set("last_name", e.target.value)}
            />
            <Input
              label={t("automation.form_birth_date")}
              placeholder={t("automation.form_date_placeholder")}
              value={values.birth_date}
              error={err("birth_date")}
              onChange={(e) => {
                const ev = e.nativeEvent as InputEvent;
                set("birth_date", formatDateInput(e.target.value, ev.inputType === "deleteContentBackward"));
              }}
            />
            <Input
              label={t("automation.form_driving_license")}
              placeholder={t("automation.form_date_placeholder")}
              value={values.first_driving_license_date}
              error={err("first_driving_license_date")}
              onChange={(e) => {
                const ev = e.nativeEvent as InputEvent;
                set(
                  "first_driving_license_date",
                  formatDateInput(e.target.value, ev.inputType === "deleteContentBackward"),
                );
              }}
            />
          </>
        )}

        <AddressFields
          ac={ac}
          labels={{
            zip: t("automation.form_zip_code"),
            city: t("automation.form_area"),
            address: t("automation.form_address"),
          }}
          errors={{
            postCode: err("zip_code"),
            city: err("area"),
            address: err("address"),
          }}
          addressHint={t("automation.form_address_hint_need_zip_area")}
        />
        <Input
          label={t("automation.form_address_number")}
          value={values.address_number}
          error={err("address_number")}
          onChange={(e) => set("address_number", e.target.value)}
        />

        <Input
          label={t("automation.form_email")}
          type="email"
          value={values.email}
          error={err("email")}
          onChange={(e) => set("email", e.target.value)}
        />
        {publicMode && (
          <>
            <Input
              label={t("automation.form_recipient_email_label")}
              placeholder={t("automation.form_recipient_email_placeholder")}
              type="email"
              value={values.recipient_email}
              error={err("recipient_email")}
              onChange={(e) => set("recipient_email", e.target.value)}
            />
            <Hint text={t("automation.form_recipient_email_hint")} />
          </>
        )}
        <Input
          label={t("automation.form_phone")}
          type="tel"
          value={values.phone}
          error={err("phone")}
          onChange={(e) => set("phone", e.target.value)}
        />
        <Hint text={t("automation.form_phone_hint")} />

        <Select
          label={t("automation.form_nationality")}
          value={values.nationality}
          error={err("nationality")}
          onChange={(e) => set("nationality", e.target.value)}
        >
          {sel(opt.nationalityOptions, false)}
        </Select>
        {showForeignersId(values) && (
          <Select
            label={t("automation.form_foreigners_id")}
            value={values.foreigners_id_type}
            error={err("foreigners_id_type")}
            onChange={(e) => set("foreigners_id_type", e.target.value)}
          >
            <option value="">{t("automation.form_select_placeholder")}</option>
            {sel(opt.foreignersIdOptions)}
          </Select>
        )}
        <Select
          label={t("automation.form_offer_language")}
          value={values.language}
          onChange={(e) => set("language", e.target.value)}
        >
          {sel(opt.languageOptions, false)}
        </Select>

        {/* Conducente principale */}
        <div>
          <div className="mb-[7px] text-[12.5px] font-medium tracking-[0.1px] text-muted">
            {t("automation.form_main_driver")}
          </div>
          <div className="flex flex-wrap gap-5">
            {opt.driverTypeOptions
              .filter(
                (d: { value: string }) => values.gender === "Company" || d.value !== "multiple",
              )
              .map((d: { value: string; label: string }) => (
                <label key={d.value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="main_driver_type"
                    checked={values.main_driver_type === d.value}
                    onChange={() => set("main_driver_type", d.value)}
                    className="h-4 w-4 accent-brand"
                  />
                  <span className="text-[14.5px] text-ink">{t(d.label)}</span>
                </label>
              ))}
          </div>
          <p className="mt-[6px] text-[12px] text-muted">
            {t("automation.form_main_driver_hint")}
          </p>
        </div>

        {showMainDriverFields(values) && (
          <div className="flex flex-col gap-4 rounded-14 bg-tint-2 p-4">
            <h3 className="text-[15px] font-bold text-ink">
              {t("automation.form_main_driver_subform_title")}
            </h3>
            <Select
              label={t("automation.form_gender")}
              value={values.main_driver.gender}
              error={err("main_driver.gender")}
              onChange={(e) => setMd("gender", e.target.value)}
            >
              <option value="">{t("automation.form_select_placeholder")}</option>
              <option value="Male">{t("automation.form_gender_male")}</option>
              <option value="Female">{t("automation.form_gender_female")}</option>
            </Select>
            <Select
              label={t("automation.form_nationality")}
              value={values.main_driver.nationality}
              error={err("main_driver.nationality")}
              onChange={(e) => setMd("nationality", e.target.value)}
            >
              <option value="">{t("automation.form_select_placeholder")}</option>
              {sel(opt.nationalityOptions, false)}
            </Select>
            {showMainDriverForeignersId(values) && (
              <Select
                label={t("automation.form_foreigners_id")}
                value={values.main_driver.foreigners_id_type}
                error={err("main_driver.foreigners_id_type")}
                onChange={(e) => setMd("foreigners_id_type", e.target.value)}
              >
                <option value="">{t("automation.form_select_placeholder")}</option>
                {sel(opt.foreignersIdOptions)}
              </Select>
            )}
            <Input
              label={t("automation.form_first_name")}
              value={values.main_driver.first_name}
              error={err("main_driver.first_name")}
              onChange={(e) => setMd("first_name", e.target.value)}
            />
            <Input
              label={t("automation.form_last_name")}
              value={values.main_driver.last_name}
              error={err("main_driver.last_name")}
              onChange={(e) => setMd("last_name", e.target.value)}
            />
            <Input
              label={t("automation.form_birth_date")}
              placeholder={t("automation.form_date_placeholder")}
              value={values.main_driver.birth_date}
              error={err("main_driver.birth_date")}
              onChange={(e) => {
                const ev = e.nativeEvent as InputEvent;
                setMd("birth_date", formatDateInput(e.target.value, ev.inputType === "deleteContentBackward"));
              }}
            />
            <Input
              label={t("automation.form_driving_license")}
              placeholder={t("automation.form_date_placeholder")}
              value={values.main_driver.first_driving_license_date}
              error={err("main_driver.first_driving_license_date")}
              onChange={(e) => {
                const ev = e.nativeEvent as InputEvent;
                setMd(
                  "first_driving_license_date",
                  formatDateInput(e.target.value, ev.inputType === "deleteContentBackward"),
                );
              }}
            />
            <Select
              label={t("automation.form_canton")}
              value={values.main_driver.canton}
              error={err("main_driver.canton")}
              onChange={(e) => setMd("canton", e.target.value)}
            >
              <option value="">{t("automation.form_select_placeholder")}</option>
              {sel(opt.cantonOptions, false)}
            </Select>
            <AddressFields
              ac={mdAc}
              labels={{
                zip: t("automation.form_zip_code"),
                city: t("automation.form_area"),
                address: t("automation.form_address"),
              }}
              errors={{
                postCode: err("main_driver.zip_code"),
                city: err("main_driver.area"),
                address: err("main_driver.address"),
              }}
              addressHint={t("automation.form_address_hint_need_zip_area")}
            />
            <Input
              label={t("automation.form_address_number")}
              value={values.main_driver.address_number}
              error={err("main_driver.address_number")}
              onChange={(e) => setMd("address_number", e.target.value)}
            />
          </div>
        )}
      </Section>

      {/* Sezione 2 — Veicolo 1 */}
      <Section title={t("automation.form_section_vehicle")}>
        <Select
          label={t("automation.form_deductible_under26")}
          value={values.deductible_under_26}
          onChange={(e) => set("deductible_under_26", e.target.value)}
        >
          {sel(opt.deductibleUnder26Options)}
        </Select>
        <Hint text={t("automation.form_deductible_under26_hint")} />
        {vehicleSection(1)}
        <Select
          label={t("automation.form_interchangeable_plate")}
          value={values.interchangeable_plate}
          onChange={(e) => set("interchangeable_plate", e.target.value)}
        >
          <option value="No">{t("automation.form_no")}</option>
          <option value="Yes">{t("automation.form_yes")}</option>
        </Select>
      </Section>

      {/* Sezione 3 — Veicolo 2 */}
      {showVehicle2(values) && (
        <Section title={t("automation.form_section_vehicle2")}>{vehicleSection(2)}</Section>
      )}

      {/* Sezione 4 — Uso e coperture */}
      <Section title={t("automation.form_section_usage")}>
        <Select
          label={t("automation.form_vehicle_usage")}
          value={values.vehicle_usage}
          onChange={(e) => set("vehicle_usage", e.target.value)}
        >
          {sel(opt.vehicleUsageOptions)}
        </Select>
        <Hint text={t("automation.form_vehicle_usage_hint")} />
        <Select
          label={t("automation.form_civil_insurance")}
          value={values.civil_insurance}
          onChange={(e) => set("civil_insurance", e.target.value)}
        >
          {sel(opt.civilInsuranceOptions)}
        </Select>
        <Hint text={t("automation.form_civil_insurance_hint")} />
        <Select
          label={t("automation.form_comprehensive")}
          value={values.comprehensive_insurance}
          onChange={(e) => set("comprehensive_insurance", e.target.value)}
        >
          {sel(opt.comprehensiveOptions)}
        </Select>
        <Hint text={t("automation.form_comprehensive_hint")} />
        {showDeductibleTotal(values) && (
          <>
            <Select
              label={t("automation.form_deductible_total")}
              value={values.deductible_total_insurance}
              onChange={(e) => set("deductible_total_insurance", e.target.value)}
            >
              {opt.deductibleTotalOptions.map((v: string) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
            <Hint text={t("automation.form_deductible_total_hint")} />
          </>
        )}
        {showDeductiblePartial(values) && (
          <>
            <Select
              label={t("automation.form_deductible_partial")}
              value={values.deductible_partial_insurance}
              onChange={(e) => set("deductible_partial_insurance", e.target.value)}
            >
              {opt.deductiblePartialOptions.map((v: string) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
            <Hint text={t("automation.form_deductible_partial_hint")} />
          </>
        )}
        <Select
          label={t("automation.form_parking_damage")}
          value={values.parking_damage_coverage}
          onChange={(e) => set("parking_damage_coverage", e.target.value)}
        >
          {sel(opt.parkingDamageOptions)}
        </Select>
        <Hint text={t("automation.form_parking_damage_hint")} />
        {showDeductibleParking(values) && (
          <>
            <Select
              label={t("automation.form_deductible_parking")}
              value={values.deductible_parking_damage}
              error={err("deductible_parking_damage")}
              onChange={(e) => set("deductible_parking_damage", e.target.value)}
            >
              <option value="">{t("automation.form_select_placeholder")}</option>
              {opt.deductibleParkingOptions.map((v: string) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
            <Hint text={t("automation.form_deductible_parking_hint")} />
          </>
        )}
        <Select
          label={t("automation.form_headlights")}
          value={values.headlights_mirrors}
          onChange={(e) => set("headlights_mirrors", e.target.value)}
        >
          {yesNo.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Hint text={t("automation.form_headlights_hint")} />
        <Select
          label={t("automation.form_personal_belongings")}
          value={values.personal_belongings_coverage}
          onChange={(e) => set("personal_belongings_coverage", e.target.value)}
        >
          {sel(opt.personalBelongingsOptions)}
        </Select>
        <Hint text={t("automation.form_personal_belongings_hint")} />
        <Select
          label={t("automation.form_tires_damage")}
          value={values.tires_damage}
          onChange={(e) => set("tires_damage", e.target.value)}
        >
          <option value="No">{t("automation.form_no")}</option>
          <option value="Yes">{t("automation.form_yes")}</option>
        </Select>
        <Hint text={t("automation.form_tires_damage_hint")} />
        <Select
          label={t("automation.form_bonus_protection")}
          value={values.bonus_protection}
          onChange={(e) => set("bonus_protection", e.target.value)}
        >
          {yesNo.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Hint text={t("automation.form_bonus_protection_hint")} />
        <Select
          label={t("automation.form_assistance")}
          value={values.roadside_assistance}
          onChange={(e) => set("roadside_assistance", e.target.value)}
        >
          {yesNo.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Hint text={t("automation.form_assistance_hint")} />
        <Select
          label={t("automation.form_garage_free_choice")}
          value={values.garage_free_choice}
          onChange={(e) => set("garage_free_choice", e.target.value)}
        >
          {sel(opt.garageFreeOptions)}
        </Select>
        <Hint text={t("automation.form_garage_free_choice_hint")} />
        <Select
          label={t("automation.form_passenger_injury")}
          value={values.passenger_injury}
          onChange={(e) => set("passenger_injury", e.target.value)}
        >
          <option value="Yes">{t("automation.form_passenger_injury_yes")}</option>
          <option value="No">{t("automation.form_no")}</option>
        </Select>
        <Hint text={t("automation.form_passenger_injury_hint")} />

        {/* Veicoli elettrici — 4 checkbox (doc 2026-03-12) */}
        <div className="rounded-14 bg-tint-2 p-4">
          <div className="mb-2 text-[13.5px] font-semibold text-ink">
            {t("automation.form_ev_title")}
          </div>
          {(
            [
              ["ev_charging_station", "automation.form_ev_charging_station"],
              ["ev_high_voltage_battery", "automation.form_ev_battery"],
              ["ev_cyber_protection", "automation.form_ev_cyber"],
              ["ev_charging_cards_apps", "automation.form_ev_cards"],
            ] as const
          ).map(([field, labelKey]) => (
            <label key={field} className="mb-1 flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(values[field])}
                onChange={(e) => set(field, e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              <span className="text-[13.5px] text-ink">{t(labelKey)}</span>
            </label>
          ))}
          <p className="mt-1 text-[12px] text-muted">{t("automation.form_ev_hint")}</p>
        </div>

        <Select
          label={t("automation.form_current_insurance")}
          value={values.current_insurance}
          onChange={(e) => set("current_insurance", e.target.value)}
        >
          {sel(opt.currentInsuranceOptions)}
        </Select>
        <Hint text={t("automation.form_current_insurance_hint")} />
        <Select
          label={t("automation.form_payment_mode")}
          value={values.payment_mode}
          onChange={(e) => set("payment_mode", e.target.value)}
        >
          {sel(opt.paymentModeOptions)}
        </Select>
        <Hint text={t("automation.form_payment_mode_hint")} />
      </Section>

      {/* Sezione 5 — Storico sinistri */}
      <Section title={t("automation.form_section_claims")}>
        <p className="-mt-2 text-[12.5px] text-muted">
          {t("automation.form_section_claims_description")}
        </p>
        {claimsRow("n_rc_claims_5_years", "automation.form_rc_claims")}
        {claimsRow("n_collisions_claims_5_years", "automation.form_collision_claims")}
        {claimsRow("n_parking_claims_5_years", "automation.form_parking_claims")}
        {claimsRow("n_glass_claims_5_years", "automation.form_glass_claims")}
        {claimsRow("n_partial_comprehensive_claims_5_years", "automation.form_partial_claims")}
        <h3 className="mt-2 text-[15px] font-bold text-ink">
          {t("automation.form_claims_3y_title")}
        </h3>
        {claimsRow("n_rc_claims_3_years", "automation.form_rc_claims_3y")}
        {claimsRow("n_collisions_claims_3_years", "automation.form_collision_claims_3y")}
        {claimsRow("n_parking_claims_3_years", "automation.form_parking_claims_3y")}
        {claimsRow("n_glass_claims_3_years", "automation.form_glass_claims_3y")}
        {claimsRow("n_partial_comprehensive_claims_3_years", "automation.form_partial_claims_3y")}
      </Section>

      {/* Sezione 6 — Altre domande (doc 2026-05-26) */}
      <Section title={t("automation.form_section_other_questions")}>
        {(
          [
            ["other_q_terminated", "automation.form_other_q_terminated"],
            ["other_q_refused", "automation.form_other_q_refused"],
          ] as const
        ).map(([field, labelKey]) => (
          <label key={field} className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={Boolean(values[field])}
              onChange={(e) => set(field, e.target.checked)}
              className="mt-1 h-4 w-4 accent-brand"
            />
            <span className="text-[13.5px] text-ink">{t(labelKey)}</span>
          </label>
        ))}
        <Select
          label={t("automation.form_other_q_license_suspension")}
          value={values.other_q_license_suspension}
          onChange={(e) => set("other_q_license_suspension", e.target.value)}
        >
          {sel(opt.licenseSuspensionOptions)}
        </Select>
      </Section>

      {/* Scrapers (solo confronto offerte, doc 2026-05-25) */}
      {showScrapersSection(values) && (
        <Section title={t("automation.scrapers_title")}>
          <p className="-mt-2 text-[12.5px] text-muted">{t("automation.scrapers_hint")}</p>
          <div className="grid grid-cols-2 gap-2">
            {availableScrapers.map((scraper) => (
              <label key={scraper} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={values.scrapers.includes(scraper)}
                  onChange={() => {
                    const current = [...values.scrapers];
                    const i = current.indexOf(scraper);
                    if (i >= 0) current.splice(i, 1);
                    else current.push(scraper);
                    set("scrapers", current);
                  }}
                  className="h-4 w-4 accent-brand"
                />
                <span className="text-[13.5px] text-ink">{scraper}</span>
              </label>
            ))}
          </div>
          {err("scrapers") && (
            <p className="text-[12.5px] font-medium text-danger">{err("scrapers")}</p>
          )}
        </Section>
      )}

      <Button fullWidth onClick={() => void onSubmit()}>
        {t("automation.submit_form")}
      </Button>

      <VehicleSearchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSelect={onVehicleSelect}
      />
    </div>
  );
}
