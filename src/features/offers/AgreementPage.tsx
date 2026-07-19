"use client";

/**
 * Port di agreement.component (/agreement — firma mandato broker):
 * testo introduttivo, checkbox "mantieni consulente", selezione assicuratori
 * (da localStorage `selectedPolicies`), download documento (jasper
 * Brokermandat{,EN,IT,FR}), canvas firma (mouse + touch) con cancella,
 * link condizioni, submit → createSignetJasperreport + mandateInformInsurances.
 */

import { useEffect, useRef, useState } from "react";
import { Check, Download, Eraser } from "lucide-react";
import clsx from "clsx";
import { Button, Card } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n, type Language } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import { convertStringToJSON } from "@/lib/helper";
import { storage } from "@/lib/storage";
import * as brokerstar from "@/lib/api/brokerstar";
import { toaster } from "@/lib/toaster";
import statics from "@/data/statics.json";

function brokermandatName(lang: Language): string {
  switch (lang) {
    case "en":
      return "BrokermandatEN";
    case "it":
      return "BrokermandatIT";
    case "fr":
      return "BrokermandatFR";
    case "de":
    default:
      return "Brokermandat";
  }
}

interface SelectedInsurance {
  id: number;
  name: string;
  selected: boolean;
}

export function AgreementPage() {
  const { userData } = useAuth();
  const { lang, t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [keepConsultant, setKeepConsultant] = useState(false);
  const [insurances, setInsurances] = useState<SelectedInsurance[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    setInsurances(
      convertStringToJSON<{ id: number; name: string }[]>(
        storage.getItem("selectedPolicies"),
        [],
      ).map((policy) => ({ id: policy.id, name: policy.name, selected: true })),
    );

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, []);

  const getPos = (e: { clientX: number; clientY: number }) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDrawing = (e: { clientX: number; clientY: number }) => {
    drawing.current = true;
    last.current = getPos(e);
  };

  const draw = (e: { clientX: number; clientY: number }) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    last.current = pos;
  };

  const stopDrawing = () => {
    drawing.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const isCanvasEmpty = (): boolean => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return true;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] !== 0) return false;
    }
    return true;
  };

  const submit = async () => {
    loader.show();
    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        toaster.alert("Please provide a signature.");
        return;
      }
      if (isCanvasEmpty()) {
        toaster.alert("Please provide a signature.");
        return;
      }
      const base64Data = canvas.toDataURL("image/png").split(",")[1];

      try {
        await brokerstar.createSignetJasperreport(
          brokermandatName(lang),
          userData.contact?.id ?? 0,
          base64Data,
        );
        void brokerstar.mandateInformInsurances(
          !keepConsultant,
          insurances.reduce<Record<string, boolean>>((acc, curr) => {
            acc[curr.id] = curr.selected;
            return acc;
          }, {}),
          userData.contact?.id ?? 0,
        );
        toaster.success(t("agreement", "successsend"));
        navigateTo("home");
      } catch {
        toaster.warn("Error generating report");
      }
    } finally {
      loader.hide();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 py-6">
      <h1 className="text-[28px] font-bold tracking-[-0.7px] text-ink">
        {t("agreement.title")}
      </h1>

      <p className="text-[13.5px] leading-relaxed text-ink-2">{t("agreement.line1")}</p>
      <ul className="flex flex-col gap-2">
        {[t("agreement.line2"), t("agreement.line3")].map((line, i) => (
          <li key={i} className="flex items-start gap-3 text-[13.5px] text-ink-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-bg text-success">
              <Check size={12} strokeWidth={2.2} />
            </span>
            {line}
          </li>
        ))}
      </ul>
      <p className="text-[13.5px] leading-relaxed text-ink-2">{t("agreement.line4")}</p>

      {/* Mantieni consulente */}
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={keepConsultant}
          onChange={(e) => setKeepConsultant(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-brand"
        />
        <span className="text-[13.5px] text-ink">
          {t("agreement.line5")}{" "}
          <span className="text-muted">{t("agreement.line5AddOn")}</span>
        </span>
      </label>

      {/* Assicuratori selezionati */}
      {insurances.length > 0 && (
        <Card className="p-0">
          {insurances.map((insurance) => (
            <button
              key={insurance.id}
              type="button"
              onClick={() =>
                setInsurances((list) =>
                  list.map((i) =>
                    i.id === insurance.id ? { ...i, selected: !i.selected } : i,
                  ),
                )
              }
              className={clsx(
                "flex w-full items-center justify-between border-t border-border-soft px-4 py-3 text-left transition-colors first:border-t-0",
                insurance.selected ? "bg-tint" : "hover:bg-tint-2",
              )}
            >
              <span
                className={clsx(
                  "truncate text-[14px] font-medium",
                  insurance.selected ? "text-brand" : "text-ink",
                )}
              >
                {insurance.name}
              </span>
              <span
                className={clsx(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  insurance.selected
                    ? "border-brand bg-brand text-white"
                    : "border-border bg-white",
                )}
              >
                {insurance.selected && <Check size={12} strokeWidth={2.2} />}
              </span>
            </button>
          ))}
        </Card>
      )}

      <Button
        variant="ghost"
        icon={<Download size={16} strokeWidth={1.6} />}
        onClick={() =>
          navigateTo(`jasper/${brokermandatName(lang)}/${userData.contact?.id}`)
        }
      >
        {t("agreement.line6") !== "MISSINGTRANSLATION"
          ? t("agreement.line6")
          : t("agreement.title")}
      </Button>

      {/* Firma */}
      <div>
        <div className="mb-[7px] text-[12.5px] font-medium tracking-[0.1px] text-muted">
          {t("agreement.sign")}
        </div>
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          className="w-full touch-none rounded-14 border border-border bg-white"
          onMouseDown={(e) => startDrawing(e)}
          onMouseMove={(e) => draw(e)}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={(e) => startDrawing(e.touches[0])}
          onTouchMove={(e) => {
            e.preventDefault();
            draw(e.touches[0]);
          }}
          onTouchEnd={stopDrawing}
        />
        <Button
          size="sm"
          variant="secondary"
          icon={<Eraser size={14} strokeWidth={1.6} />}
          onClick={clearSignature}
          className="mt-2"
        >
          {t("agreement.clear") !== "MISSINGTRANSLATION" ? t("agreement.clear") : "Clear"}
        </Button>
      </div>

      {/* Condizioni */}
      <button
        type="button"
        onClick={() => navigateTo(statics.LinkOneZoneAGB[lang])}
        className="text-left text-[12.5px] text-ink-2"
      >
        <span className="font-semibold text-brand underline-offset-2 hover:underline">
          {t("agreement.line7")}
        </span>{" "}
        <span>{t("agreement.line9")}</span>
      </button>

      <Button fullWidth onClick={() => void submit()}>
        {t("agreement.send")}
      </Button>
    </div>
  );
}
