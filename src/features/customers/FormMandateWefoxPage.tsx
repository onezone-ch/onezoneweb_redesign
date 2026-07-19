"use client";

/**
 * Port di form-mandate-wefox.component (/form-mandate-wefox):
 * replica del form "Mandate einreichen" Wefox (doc 2026-03-31).
 * Solo frontend come l'originale: submit → log + messaggio di successo.
 * Label hardcoded in tedesco (parità col sorgente, nessuna i18n).
 */

import { useState, type DragEvent } from "react";
import { Check, FileUp, X } from "lucide-react";
import clsx from "clsx";
import { Button, Card, Input, Select } from "@/components/ui";

const INSURANCE_COMPANIES = [
  "Allianz", "ASGA", "Automate", "AXA", "Baloise", "Belsura",
  "Coop RSV", "Dextra", "Elips", "Emilia", "Emmental", "Generali",
  "Groupe Mutuel", "GVB Gebäude", "Helsana", "Helvetia", "Innova",
  "Liberty", "Mobiliar", "ÖKK", "Orion", "PAX", "PK Pro - Tellco",
  "Profond", "Protekta", "Simpego", "Smile", "Solida", "Swica",
  "Swiss Life", "Sympany", "TSM", "Vaudoise", "Valitas", "Visana",
  "Zürich",
];

const BERATER_OPTIONS = [
  "Arfaoui Hamdi - F01493007", "Belotti Mélissa - F01539915",
  "Ben Hassine Hedi - F01494126", "Bouazzi Samira - F01492898",
  "Bouzerzour Sabrina - F01463091", "Braham Michael - F01397752",
  "Brancaccio Giulia - F01495141", "Carrubba Rosario - F01495135",
  "Cereja Eden - F01502195", "Correia Telma - F01541711",
  "Cotardo Giada - F01495023", "Debrunner Monika - F01070186",
  "Debrunner Rahel Sabine - F01538885-", "Elkaz Osman - F01104534",
  "Fofana Sagiie - F01543810", "Francione Francesca - F01495021",
  "Ghaffouri Hiwa - F01495338", "Ghemame Youness - F01539918",
  "Gonçalves Nuno - F01528811", "Goodwin Jay Samuel - F01558085",
  "Guislain Sarra - F01465244", "Hamira Brahim - F01528580",
  "Hipolito Dos Santos Filipe Miguel - F01114946", "Jashari Arbnor - F01544452",
  "Kathirgamu Sabisanth - F01494971", "Künzli Pascal - F01544454",
  "Kuqi Skender - F01495715", "Lopes Eric - F01539763",
  "Mahmuti Vlera - F01545749", "Marguiron Yanis - F01543808",
  "Mathez Christian Stéphane - F01259903", "Meepagama Dishan - F01490838",
  "Merabti Ziad - F01538571", "Micocci Roberta - F01495144",
  "Miftari Aridon - F01530201", "Montalbano Federica - F01514853",
  "Münger Andrej - F01537198", "Naji Youssef - F01527850",
  "N'guessan Money - F01529512", "Noufir Rida - F01521034",
  "Paternicola Concetta - F01540211", "Pereira João Manuel - F01528829",
  "Pereira Correia Tiago José - F01536992", "Roux Pierre-Olivier - F01465246",
  "Stevenazzi Mafalda - F01495019", "Sucurovic Vlada - F01506624",
  "Syhora Cyril - F01544450", "Tedla Ebenezer - F01437123",
  "Tevisio Ilaria - F01495207", "Travaglini Alessandro - F01495137",
  "Tyurin Mikhail - F01539658", "Vijayakumar Lugishan - F01495620",
  "Wymann Yoshi - F01525518", "Zodio Matteo - F01495222",
  "Zogib Melissa - F01538950", "Zogib Amir - F01364912",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FileKind = "mandat" | "ausweis";

function FileDropZone({
  label,
  file,
  onFile,
  onRemove,
}: {
  label: string;
  file: File | null;
  onFile: (f: File) => void;
  onRemove: () => void;
}) {
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      onFile(e.dataTransfer.files[0]);
    }
  };
  return (
    <div>
      <div className="mb-[7px] text-[12.5px] font-medium tracking-[0.1px] text-muted">
        {label}
      </div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={onDrop}
        className={clsx(
          "relative flex cursor-pointer flex-col items-center gap-2 rounded-14 border border-dashed p-5 transition-colors",
          file ? "border-brand bg-tint" : "border-border bg-tint-2 hover:bg-tint",
        )}
      >
        <FileUp size={24} strokeWidth={1.6} className={file ? "text-brand" : "text-muted"} />
        <p
          className={clsx(
            "text-center text-[12.5px]",
            file ? "font-semibold text-brand" : "text-muted",
          )}
        >
          {file ? file.name : "Datei hierher ziehen oder klicken"}
        </p>
        {file && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-muted shadow-card hover:text-danger"
            aria-label="Remove file"
          >
            <X size={13} strokeWidth={2} />
          </button>
        )}
        <input
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </label>
    </div>
  );
}

export function FormMandateWefoxPage() {
  const [values, setValues] = useState<Record<string, string>>({
    anrede: "Firma",
    firmenname: "",
    vorname: "",
    nachname: "",
    strasse: "",
    hausnummer: "",
    plz: "",
    ort: "",
    email: "",
    mobile: "",
    berater: BERATER_OPTIONS[0],
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  const [files, setFiles] = useState<Record<FileKind, File | null>>({
    mandat: null,
    ausweis: null,
  });

  const showCompanyName = values.anrede === "Firma";

  const set = (field: string, value: string) =>
    setValues((v) => ({ ...v, [field]: value }));

  const getError = (field: string): string => {
    if (!submitted) return "";
    const value = values[field]?.trim() ?? "";
    const requiredFields = [
      "anrede", "vorname", "nachname", "strasse", "hausnummer", "plz", "ort", "email", "mobile",
    ];
    if (showCompanyName) requiredFields.push("firmenname");
    if (requiredFields.includes(field) && !value) return "Dieses Feld ist erforderlich";
    if (field === "email" && value && !EMAIL_RE.test(value)) {
      return "Bitte geben Sie eine gültige E-Mail-Adresse ein";
    }
    return "";
  };

  const isFormValid = (): boolean => {
    const requiredFields = [
      "anrede", "vorname", "nachname", "strasse", "hausnummer", "plz", "ort", "email", "mobile",
    ];
    if (showCompanyName) requiredFields.push("firmenname");
    return (
      requiredFields.every((f) => values[f]?.trim()) && EMAIL_RE.test(values.email.trim())
    );
  };

  const onSubmit = () => {
    setSubmitted(true);
    if (!isFormValid()) return;
    console.log("Mandate form data:", {
      ...values,
      versicherungsgesellschaften: selectedInsurances,
      mandatFile: files.mandat,
      ausweisFile: files.ausweis,
    });
    setSubmitSuccess(true);
  };

  if (submitSuccess) {
    return (
      <div className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-4 px-6 py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success">
          <Check size={26} strokeWidth={1.8} />
        </div>
        <h1 className="text-center text-[22px] font-bold tracking-[-0.5px] text-ink">
          Mandat erfolgreich eingereicht
        </h1>
        <p className="text-center text-[13.5px] text-ink-2">
          Vielen Dank. Wir werden Ihre Angaben prüfen und uns bei Ihnen melden.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-5 px-5 py-6">
      <h1 className="text-[28px] font-bold tracking-[-0.7px] text-ink">
        Mandat einreichen
      </h1>

      <Card>
        <div className="flex flex-col gap-4">
          <Select
            label="ANREDE"
            value={values.anrede}
            error={getError("anrede")}
            onChange={(e) => set("anrede", e.target.value)}
          >
            <option value="Firma">Firma</option>
            <option value="Herr">Herr</option>
            <option value="Frau">Frau</option>
          </Select>
          {showCompanyName && (
            <Input
              label="FIRMENNAME"
              value={values.firmenname}
              error={getError("firmenname")}
              onChange={(e) => set("firmenname", e.target.value)}
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="VORNAME"
              value={values.vorname}
              error={getError("vorname")}
              onChange={(e) => set("vorname", e.target.value)}
            />
            <Input
              label="NACHNAME"
              value={values.nachname}
              error={getError("nachname")}
              onChange={(e) => set("nachname", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-[2fr_1fr] gap-4">
            <Input
              label="STRASSE"
              value={values.strasse}
              error={getError("strasse")}
              onChange={(e) => set("strasse", e.target.value)}
            />
            <Input
              label="HAUSNUMMER"
              value={values.hausnummer}
              error={getError("hausnummer")}
              onChange={(e) => set("hausnummer", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-[1fr_2fr] gap-4">
            <Input
              label="PLZ"
              value={values.plz}
              error={getError("plz")}
              onChange={(e) => set("plz", e.target.value)}
            />
            <Input
              label="ORT"
              value={values.ort}
              error={getError("ort")}
              onChange={(e) => set("ort", e.target.value)}
            />
          </div>
          <Input
            label="E-MAIL"
            type="email"
            value={values.email}
            error={getError("email")}
            onChange={(e) => set("email", e.target.value)}
          />
          <Input
            label="MOBILE"
            type="tel"
            value={values.mobile}
            error={getError("mobile")}
            onChange={(e) => set("mobile", e.target.value)}
          />
          <Select
            label="BERATER"
            value={values.berater}
            onChange={(e) => set("berater", e.target.value)}
          >
            {BERATER_OPTIONS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card>
        <div className="mb-3 text-[12.5px] font-medium tracking-[0.1px] text-muted">
          VERSICHERUNGSGESELLSCHAFTEN
        </div>
        <div className="grid max-h-64 grid-cols-2 gap-x-4 gap-y-2 overflow-y-auto">
          {INSURANCE_COMPANIES.map((company) => (
            <label key={company} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={selectedInsurances.includes(company)}
                onChange={(e) =>
                  setSelectedInsurances((list) =>
                    e.target.checked
                      ? [...list, company]
                      : list.filter((c) => c !== company),
                  )
                }
                className="h-4 w-4 accent-brand"
              />
              <span className="text-[13.5px] text-ink">{company}</span>
            </label>
          ))}
        </div>
      </Card>

      <FileDropZone
        label="MANDAT (PDF)"
        file={files.mandat}
        onFile={(f) => setFiles((s) => ({ ...s, mandat: f }))}
        onRemove={() => setFiles((s) => ({ ...s, mandat: null }))}
      />
      <FileDropZone
        label="AUSWEIS"
        file={files.ausweis}
        onFile={(f) => setFiles((s) => ({ ...s, ausweis: f }))}
        onRemove={() => setFiles((s) => ({ ...s, ausweis: null }))}
      />

      <Button fullWidth onClick={onSubmit}>
        Einreichen
      </Button>
    </div>
  );
}
