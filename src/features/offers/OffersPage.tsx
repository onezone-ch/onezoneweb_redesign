"use client";

/**
 * Port di offers.component (/offer, /offer/:offerid):
 * - tab Sospese/Accettate/Rifiutate (filtro su offer.isAccepted null/true/false);
 * - tender collassabili con conteggio offerte filtrate;
 * - per offerta: assicurazione, importo, contatta consulente, accetta/rifiuta
 *   (solo pendenti, con reload lista), download allegato;
 * - preselezione da :offerid → apre il tender e seleziona il tab giusto.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, Download, X } from "lucide-react";
import { Button, Segmented } from "@/components/ui";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import { clone, isset, isTrue } from "@/lib/helper";
import * as brokerstar from "@/lib/api/brokerstar";

type OfferStatus = "pendent" | "accepted" | "declined";

interface Offer {
  id: number;
  isAccepted: boolean | null;
  amountBrutto: number;
  insurance: { name: string };
  contact: { id: number };
  attachment?: { id?: number };
}

interface Tender {
  id: string;
  open: boolean;
  branch: { name: Record<string, string> };
  offers: Offer[];
}

export function OffersPage({ offerid }: { offerid?: string }) {
  const { lang, t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [tab, setTab] = useState<OfferStatus>("pendent");
  const [tenders, setTenders] = useState<Tender[]>([]);
  const initialTenderID = useRef(offerid ? Number(offerid) : 0);
  const started = useRef(false);

  const loadTenderList = useCallback(async () => {
    loader.show();
    try {
      const response = await brokerstar.tender();
      const tendersData =
        ((response as { data?: unknown[] })?.data as Tender[]) ??
        ((response as Tender[]) || []);
      const list: Tender[] = (Array.isArray(tendersData) ? tendersData : []).map(
        (tender) => ({ ...tender, open: false, offers: [] }),
      );

      // carica le offerte di ogni tender
      await Promise.all(
        list.map(async (tender) => {
          const res = await brokerstar.tenderOffer(tender.id);
          let offers =
            ((res as { data?: Offer[] })?.data as Offer[]) ?? ((res as Offer[]) || []);
          if (!Array.isArray(offers)) offers = [];
          tender.offers = offers;
        }),
      );

      // preselezione da /offer/:offerid
      if (initialTenderID.current > 0) {
        const target = list.find((o) =>
          isset(o.offers?.find((o2) => o2.id === initialTenderID.current)),
        );
        if (target && target.offers) {
          const bPendent = target.offers.every((o) => !isTrue(o.isAccepted));
          const bAccepted = isset(
            target.offers.find(
              (o) => o.id === initialTenderID.current && isTrue(o.isAccepted),
            ),
          );
          if (bPendent) setTab("pendent");
          else if (bAccepted) setTab("accepted");
          else setTab("declined");
          target.open = true;
        }
        initialTenderID.current = 0;
      }

      setTenders(list);
    } finally {
      loader.hide();
    }
  }, [loader]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void loadTenderList();
  }, [loadTenderList]);

  const filterOffers = (offers: Offer[]): Offer[] =>
    offers.filter((offer) => {
      if (!offer) return false;
      if (tab === "pendent") return offer.isAccepted === null;
      if (tab === "accepted") return offer.isAccepted === true;
      return offer.isAccepted === false;
    });

  const tendersFiltered = tenders.reduce<Tender[]>((previous, branch) => {
    const cleanBranch = clone(branch);
    cleanBranch.offers = filterOffers(cleanBranch.offers || []);
    if (cleanBranch.offers.length > 0) {
      return previous.concat([cleanBranch]);
    }
    return previous;
  }, []);

  const counts = {
    pendent: tenders.reduce((n, tr) => n + (tr.offers || []).filter((o) => o?.isAccepted === null).length, 0),
    accepted: tenders.reduce((n, tr) => n + (tr.offers || []).filter((o) => o?.isAccepted === true).length, 0),
    declined: tenders.reduce((n, tr) => n + (tr.offers || []).filter((o) => o?.isAccepted === false).length, 0),
  };

  const toggleTender = (id: string) =>
    setTenders((list) =>
      list.map((tr) => (tr.id === id ? { ...tr, open: !tr.open } : tr)),
    );

  const acceptOffer = async (offerID: number) => {
    loader.show();
    try {
      await brokerstar.tenderOfferAccept(String(offerID));
      await loadTenderList();
    } finally {
      loader.hide();
    }
  };

  const rejectOffer = async (offerID: number) => {
    loader.show();
    try {
      await brokerstar.tenderOfferReject(String(offerID));
      await loadTenderList();
    } finally {
      loader.hide();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[800px] flex-col px-5 py-6">
      <h1 className="mb-6 text-[28px] font-bold tracking-[-0.7px] text-ink">
        {t("offer.title")}
      </h1>

      <Segmented<OfferStatus>
        fullWidth
        className="mb-6"
        options={[
          { value: "pendent", label: t("offer.nav.pendent"), count: counts.pendent },
          { value: "accepted", label: t("offer.nav.accepted"), count: counts.accepted },
          { value: "declined", label: t("offer.nav.declined"), count: counts.declined },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tendersFiltered.map((tender) => (
        <div
          key={tender.id}
          className="mb-4 overflow-hidden rounded-16 border border-border-soft bg-white"
        >
          <button
            type="button"
            onClick={() => toggleTender(tender.id)}
            className="flex w-full items-center justify-between border-b border-border-soft p-4 text-left transition-colors hover:bg-tint-2"
          >
            <span className="text-[14.5px] font-semibold text-ink">
              {tender.branch.name[lang]} ({tender.offers?.length || 0})
            </span>
            {tender.open ? (
              <ChevronUp size={16} strokeWidth={1.6} className="text-muted" />
            ) : (
              <ChevronDown size={16} strokeWidth={1.6} className="text-muted" />
            )}
          </button>

          {tender.open && (
            <div className="flex flex-col gap-4 p-4">
              {tender.offers.map((offer) => (
                <div key={offer.id} className="rounded-14 bg-tint-2 p-4">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[15px] font-bold text-ink">
                        {offer.insurance.name}
                      </h3>
                      <p className="mt-0.5 text-[14px] text-ink-2">
                        CHF {offer.amountBrutto}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigateTo(`consultant/${offer.contact.id}`)}
                      className="shrink-0 text-[13px] font-semibold text-brand underline-offset-2 hover:underline"
                    >
                      {t("offer.contact")}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tab === "pendent" && (
                      <>
                        <Button
                          size="sm"
                          icon={<Check size={14} strokeWidth={1.6} />}
                          onClick={() => void acceptOffer(offer.id)}
                        >
                          {t("offer.button.accept")}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          icon={<X size={14} strokeWidth={1.6} />}
                          onClick={() => void rejectOffer(offer.id)}
                        >
                          {t("offer.button.decline")}
                        </Button>
                      </>
                    )}
                    {offer.attachment?.id && (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Download size={14} strokeWidth={1.6} />}
                        onClick={() => navigateTo(`file/${offer.attachment!.id}`)}
                      >
                        {t("offer.button.download")}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
