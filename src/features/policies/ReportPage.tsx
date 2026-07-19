"use client";

/**
 * Port di report.component (/report/:policyid — segnala sinistro):
 * card polizza, punto di contatto, data sinistro, descrizione,
 * galleria foto con add/remove, submit → createClaim + upload foto +
 * claimInformInsurances + toast + home.
 */

import { useEffect, useRef, useState } from "react";
import { Plus, Send, ShieldCheck, X } from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import * as brokerstar from "@/lib/api/brokerstar";
import { toaster } from "@/lib/toaster";
import { loadAvatarDataUrl } from "./insuranceAvatar";

interface PolicyState {
  id: number;
  insurance: number;
  img: string;
  title: Record<string, string> | string;
  nr: string;
}

export function ReportPage({ policyid }: { policyid: string }) {
  const { userData } = useAuth();
  const { lang, t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [policy, setPolicy] = useState<PolicyState>({
    id: 0,
    insurance: 0,
    img: "",
    title: "",
    nr: "",
  });
  const [dateOfInjure, setDateOfInjure] = useState("");
  const [injureDescription, setInjureDescription] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    loader.show();
    brokerstar
      .policy(policyid)
      .then((response) => {
        const r = response as {
          insurance: { id: number };
          branch: { name: Record<string, string> };
          nr: unknown;
        };
        setPolicy((p) => ({
          ...p,
          id: Number(policyid),
          insurance: r.insurance.id,
          title: r.branch.name,
          nr: String(r.nr),
        }));
        void loadAvatarDataUrl(r.insurance.id).then((img) => {
          if (img) setPolicy((p) => ({ ...p, img }));
        });
      })
      .finally(() => loader.hide());
  }, [policyid, loader]);

  const addImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.multiple = true;
    input.onchange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files) {
        setImages((imgs) => imgs.concat(Array.from(target.files!)));
      }
    };
    input.click();
  };

  const removeImage = (index: number) =>
    setImages((imgs) => imgs.filter((_, i) => i !== index));

  const submit = async () => {
    const dateTime = `${String(dateOfInjure)} 00:00:00`;
    loader.show();
    try {
      const response = (await brokerstar.createClaim(
        policy.id,
        dateTime,
        injureDescription,
      )) as { id: number } | undefined;
      if (!response) return;

      if (images.length > 0) {
        await brokerstar
          .uploadFile(images, String(response.id))
          .catch((error) => console.error("Error uploading file:", error));
      }
      loader.hide();

      void brokerstar.claimInformInsurances(response.id);
      toaster.success(t("injure", "injurecreated"));
      navigateTo("home");
    } finally {
      loader.hide();
    }
  };

  const pointOfContact = (userData.pointOfContact ?? {}) as {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  const title = typeof policy.title === "string" ? policy.title : policy.title[lang] || "";

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-5 px-5 py-6">
      <h1 className="text-[28px] font-bold tracking-[-0.7px] text-ink">
        {t("injure.title")}
      </h1>

      {/* Card polizza */}
      <Card floating className="mx-auto flex w-60 flex-col items-center">
        {policy.img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={policy.img} alt={title} className="mb-3 max-h-16 max-w-full object-contain" />
        ) : (
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-11 bg-tint text-brand">
            <ShieldCheck size={20} strokeWidth={1.6} />
          </div>
        )}
        <p className="text-center text-[13.5px] font-semibold text-ink">{title}</p>
      </Card>

      {/* Info */}
      <div className="text-[14px] text-ink-2">
        <p className="mb-1">
          {t("injure.subject")}: <span className="font-semibold text-ink">{policy.nr}</span>
        </p>
        <p>
          {pointOfContact.firstName} {pointOfContact.lastName}, {pointOfContact.phone},{" "}
          {pointOfContact.email}
        </p>
      </div>

      <Input
        label={t("injure.date")}
        type="date"
        value={dateOfInjure}
        onChange={(e) => setDateOfInjure(e.target.value)}
      />
      <Textarea
        label={t("injure.details")}
        rows={4}
        value={injureDescription}
        onChange={(e) => setInjureDescription(e.target.value)}
      />

      {/* Foto */}
      <div>
        <div className="mb-[7px] text-[12.5px] font-medium tracking-[0.1px] text-muted">
          {t("injure.photos")}
        </div>
        <div className="flex flex-wrap gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative h-24 w-24 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={URL.createObjectURL(image)}
                alt="Foto sinistro"
                className="h-full w-full rounded-14 object-cover shadow-card"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white shadow-card transition-colors hover:bg-[#8d2940]"
                aria-label="Remove"
              >
                <X size={13} strokeWidth={2.2} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addImage}
            className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-14 border border-dashed border-border bg-white text-brand transition-colors hover:bg-tint-2"
            aria-label="Add photo"
          >
            <Plus size={20} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      <Button
        fullWidth
        icon={<Send size={16} strokeWidth={1.6} />}
        onClick={() => void submit()}
        className="mt-2"
      >
        {t("injure.send")}
      </Button>
    </div>
  );
}
