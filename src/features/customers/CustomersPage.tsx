"use client";

/**
 * Port di customers.component (/customers — solo consulenti):
 * - ricerca con debounce 300ms (reset paginazione, no cache in ricerca);
 * - infinite scroll sul <main> (soglia 200px dal fondo);
 * - cache sessionStorage `customers-cache` per pagina (TTL 5 min) con
 *   revalidate/enrich in background (has_mandate_file, policy_count,
 *   sub_contact_count);
 * - utente auth in testa alla pagina 1; card cliente con badge Mandato,
 *   conteggi, indirizzo e azioni rapide tel/email.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Mail, Phone, Plus, Search } from "lucide-react";
import { Badge, Button, EmptyState, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import * as brokerstar from "@/lib/api/brokerstar";
import { UsersRound } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  address?: string;
  postcode?: string;
  city?: string;
  mail?: string;
  mailPrivate?: string;
  phoneDirect?: string;
  phonePrivate?: string;
  phoneWork?: string;
  mobile?: string;
  enriched: boolean;
  hasMandateFile: boolean;
  policyCount: number;
  subContactCount: number;
}

interface CacheEntry {
  timestamp: number;
  totalPages: number;
  pages: Record<number, Customer[]>;
}

const CACHE_KEY = "customers-cache";
const CACHE_TTL_MS = 5 * 60 * 1000;

const BASE_PARAMS = { "filters[show_contacts]": 2, limit: 15 };
const ENRICH_PARAMS = {
  "filters[show_contacts]": 2,
  limit: 50,
  "add[has_mandate_file]": "true",
  "add[policy_count]": "true",
  "add[sub_contact_count]": "true",
};

function readCache(): CacheEntry | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

function writeCachePage(page: number, customers: Customer[], totalPages: number): void {
  try {
    const existing = readCache() ?? {
      timestamp: Date.now(),
      totalPages,
      pages: {} as Record<number, Customer[]>,
    };
    existing.totalPages = totalPages;
    existing.pages[page] = customers;
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(existing));
  } catch {
    // sessionStorage pieno o disabilitato
  }
}

export function CustomersPage() {
  const { userData, getUserName } = useAuth();
  const { t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const state = useRef({
    currentPage: 0,
    totalPages: 0,
    isLoadingPage: false,
    allPagesLoaded: false,
    search: "",
  });
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enrichPage = useCallback(
    async (page: number, q: string, saveToCache: boolean) => {
      const response = await brokerstar.loadContactPage(page, {
        ...ENRICH_PARAMS,
        q,
      });
      if (!response?.data) return;
      const enrichData = response.data as {
        id: number;
        hasMandateFile?: boolean;
        policyCount?: number;
        subContactCount?: number;
      }[];
      setCustomers((prev) => {
        const next = prev.map((customer) => {
          const contact = enrichData.find((c) => c.id === customer.id);
          if (!contact) return customer;
          return {
            ...customer,
            hasMandateFile: !!contact.hasMandateFile,
            policyCount: contact.policyCount || 0,
            subContactCount: contact.subContactCount || 0,
            enriched: true,
          };
        });
        if (saveToCache) {
          const pageCustomers = next.filter((c) =>
            enrichData.some((contact) => contact.id === c.id),
          );
          writeCachePage(page, pageCustomers, state.current.totalPages);
        }
        return next;
      });
    },
    [],
  );

  const loadNextPage = useCallback(
    async (search?: string) => {
      const st = state.current;
      if (st.isLoadingPage) return;

      const nextPage = st.currentPage + 1;
      const q = search ?? st.search;

      // Con ricerca attiva non usiamo la cache
      if (!q) {
        const cache = readCache();
        const cachedPage = cache?.pages[nextPage];
        if (cachedPage) {
          st.totalPages = cache!.totalPages;
          st.currentPage = nextPage;
          st.allPagesLoaded = st.currentPage >= st.totalPages;
          setCustomers((prev) => [...prev, ...cachedPage]);
          // revalidate in background
          void enrichPage(nextPage, q, false);
          return;
        }
      }

      st.isLoadingPage = true;
      loader.show();
      try {
        const response = await brokerstar.loadContactPage(nextPage, {
          ...BASE_PARAMS,
          q,
        });
        if (response?.data) {
          st.totalPages = response.pages || 1;
          st.currentPage = nextPage;
          st.allPagesLoaded = st.currentPage >= st.totalPages;

          const newCustomers: Customer[] = (
            response.data as Record<string, unknown>[]
          ).map((contact) => {
            const c = contact as {
              id: number;
              contactType?: { id: number };
              name1?: unknown;
              name2?: unknown;
              address?: string;
              postcode?: string;
              city?: string;
              mail?: string;
              mailPrivate?: string;
              phoneDirect?: string;
              phonePrivate?: string;
              phoneWork?: string;
              mobile?: string;
            };
            return {
              id: c.id,
              name: getUserName(c.contactType?.id, String(c.name1), String(c.name2)),
              address: c.address,
              postcode: c.postcode,
              city: c.city,
              mail: c.mail,
              mailPrivate: c.mailPrivate,
              phoneDirect: c.phoneDirect,
              phonePrivate: c.phonePrivate,
              phoneWork: c.phoneWork,
              mobile: c.mobile,
              enriched: false,
              hasMandateFile: false,
              policyCount: 0,
              subContactCount: 0,
            };
          });

          // utente auth in testa (solo pagina 1)
          if (st.currentPage === 1) {
            const authUserId = userData?.contact?.id;
            const authUserIndex = newCustomers.findIndex((c) => c.id === authUserId);
            if (authUserIndex > 0) {
              const [authUser] = newCustomers.splice(authUserIndex, 1);
              newCustomers.unshift(authUser);
            }
          }

          setCustomers((prev) => [...prev, ...newCustomers]);
          void enrichPage(nextPage, q, !q);
        }
      } finally {
        st.isLoadingPage = false;
        loader.hide();
      }
    },
    [loader, getUserName, userData, enrichPage],
  );

  const resetAndLoad = useCallback(
    (search: string) => {
      state.current.currentPage = 0;
      state.current.totalPages = 0;
      state.current.allPagesLoaded = false;
      state.current.search = search;
      setCustomers([]);
      void loadNextPage(search);
    },
    [loadNextPage],
  );

  // ricerca con debounce 300ms (caricamento iniziale incluso: search="")
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => resetAndLoad(searchValue), 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  // infinite scroll sul main
  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (!mainElement) return;
    const onScroll = () => {
      const nearBottom =
        mainElement.scrollHeight - mainElement.scrollTop - mainElement.clientHeight < 200;
      if (nearBottom && !state.current.isLoadingPage && !state.current.allPagesLoaded) {
        void loadNextPage();
      }
    };
    mainElement.addEventListener("scroll", onScroll);
    return () => mainElement.removeEventListener("scroll", onScroll);
  }, [loadNextPage]);

  const phone = (customer: Customer) => {
    const number =
      customer.phoneDirect || customer.phonePrivate || customer.phoneWork || customer.mobile;
    if (number) window.open(`tel:${number}`, "_blank");
  };

  const mail = (customer: Customer) => {
    const address = customer.mail || customer.mailPrivate;
    if (address) window.open(`mailto:${address}`, "_blank");
  };

  return (
    <div className="mx-auto flex w-full max-w-[800px] flex-col px-5 py-6">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-[-0.7px] text-ink">
          {t("customers.title")}
        </h1>
        <Button
          size="sm"
          variant="ghost"
          icon={<Plus size={14} strokeWidth={1.6} />}
          onClick={() => navigateTo("customers-mandate-add")}
        >
          {t("customers.add")}
        </Button>
      </div>

      <div className="relative mb-5">
        <Input
          placeholder={t("customers.search")}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="[&_input]:pr-11"
        />
        <Search
          size={18}
          strokeWidth={1.6}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>

      <div className="flex flex-col gap-3">
        {customers.map((customer) => (
          <button
            key={customer.id}
            type="button"
            onClick={() => navigateTo(`policies/${customer.id}`)}
            className="rounded-16 border border-border-soft bg-white p-4 text-left transition-all hover:border-border hover:shadow-card"
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <h3 className="text-[15px] font-bold text-ink">{customer.name}</h3>
              {customer.enriched && customer.hasMandateFile && (
                <Badge variant="success">{t("customers.mandat")}</Badge>
              )}
            </div>
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0">
                {customer.enriched && (
                  <p className="text-[12.5px] text-muted">
                    {t("customers.people")} ({customer.subContactCount}) ·{" "}
                    {t("customers.policies")} ({customer.policyCount})
                  </p>
                )}
                {customer.address && (
                  <p className="truncate text-[13px] text-ink-2">{customer.address}</p>
                )}
                {(customer.postcode || customer.city) && (
                  <p className="text-[13px] text-ink-2">
                    {customer.postcode} {customer.city}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    phone(customer);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && phone(customer)}
                  className="flex h-9 w-9 items-center justify-center rounded-11 bg-tint text-brand transition-colors hover:bg-[#e2e8f4]"
                  aria-label="Call"
                >
                  <Phone size={16} strokeWidth={1.6} />
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    mail(customer);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && mail(customer)}
                  className="flex h-9 w-9 items-center justify-center rounded-11 bg-tint text-brand transition-colors hover:bg-[#e2e8f4]"
                  aria-label="Email"
                >
                  <Mail size={16} strokeWidth={1.6} />
                </span>
              </div>
            </div>
          </button>
        ))}

        {customers.length === 0 && !state.current.isLoadingPage && (
          <EmptyState
            icon={<UsersRound size={24} strokeWidth={1.6} />}
            title="No customers found"
          />
        )}
      </div>
    </div>
  );
}
