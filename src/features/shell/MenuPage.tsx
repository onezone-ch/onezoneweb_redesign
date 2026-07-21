"use client";

/**
 * Port di menu.component: indice sezioni da `customerportalmenu(2)`,
 * blocco azioni in fondo — "Gestione consulenti" (solo admin 58/25755),
 * logout (azione distruttiva, in danger), link sito OneZone.
 */

import { useEffect, useRef, useState } from "react";
import { ExternalLink, LogOut, Settings2 } from "lucide-react";
import { ListCard, ListRow } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import { isAdmin } from "@/lib/auth/roles";
import * as brokerstar from "@/lib/api/brokerstar";
import statics from "@/data/statics.json";

interface MenuEntry {
  name: Record<string, string>;
  url: Record<string, string>;
}

export function MenuPage() {
  const { userData, logout } = useAuth();
  const { lang, t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [menu, setMenu] = useState<MenuEntry[]>([]);
  const loaded = useRef(false);
  const isAdminUser = isAdmin(userData);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    loader.show();
    brokerstar
      .customerportalmenu(2)
      .then((response) => setMenu((response as MenuEntry[]) || []))
      .finally(() => loader.hide());
  }, [loader]);

  const doLogout = async () => {
    loader.show();
    await logout();
    navigateTo("login");
    loader.hide();
  };

  return (
    <div className="mx-auto flex w-full max-w-[800px] flex-1 flex-col justify-between gap-6 px-5 py-6">
      {menu.length > 0 && (
        <ListCard>
          {menu.map((entry, i) => (
            <ListRow
              key={i}
              title={entry.name[lang]}
              onClick={() => navigateTo(entry.url[lang])}
              chevron
            />
          ))}
        </ListCard>
      )}

      <ListCard>
        {isAdminUser && (
          <ListRow
            icon={<Settings2 size={18} strokeWidth={1.6} />}
            title={t("menu.consultantManagement")}
            onClick={() => navigateTo("consultant-automation")}
            chevron
          />
        )}
        <ListRow
          icon={<LogOut size={18} strokeWidth={1.6} className="text-danger" />}
          title={<span className="text-danger">{t("nav.logout")}</span>}
          onClick={() => void doLogout()}
          chevron={false}
        />
        <ListRow
          icon={<ExternalLink size={18} strokeWidth={1.6} />}
          title={t("nav.web")}
          onClick={() => navigateTo(statics.LinkOneZoneWebsite[lang])}
          chevron={false}
        />
      </ListCard>
    </div>
  );
}
