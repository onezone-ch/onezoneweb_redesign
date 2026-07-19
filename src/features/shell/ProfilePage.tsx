"use client";

/**
 * Port di profile.component:
 * - carousel contatti orizzontale (contactContactList filters[show_contacts]=1,
 *   utente auth in testa, avatar Blob→dataURL) + "+ Aggiungi profilo" (→/link/:id);
 * - sezioni collassabili: Dati personali, Indirizzo (edit inline),
 *   Accesso (email/mobile/password — il cambio credenziali fa logout, parità),
 *   Documenti (lazy load, upload immagine + apri file/:id).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Pencil,
  Plus,
  Upload,
  UserRound,
} from "lucide-react";
import { Button, HScroll, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import { useNavigator } from "@/lib/navigation";
import { isset } from "@/lib/helper";
import * as brokerstar from "@/lib/api/brokerstar";
import { toaster } from "@/lib/toaster";
import clsx from "clsx";

interface Contact {
  id: number;
  name?: string;
  birthday?: string;
  address?: string;
  postcode?: string;
  city?: string;
  mail?: string;
  mobile?: string;
  avatar?: Blob | string;
  img?: string;
  currentPassword?: string;
  password?: string;
  [key: string]: unknown;
}

interface ProfileFile {
  id: number;
  name: Record<string, string>;
  file?: { id?: number; name?: string };
}

function formatDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

function SectionHeader({
  title,
  open,
  onToggle,
  onEdit,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border-soft py-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex-1 text-left text-[15px] font-semibold text-ink"
      >
        {title}
      </button>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="mr-4 flex h-8 w-8 items-center justify-center rounded-10 text-muted transition-colors hover:bg-tint-2 hover:text-brand"
          aria-label="Edit"
        >
          <Pencil size={16} strokeWidth={1.6} />
        </button>
      )}
      <button type="button" onClick={onToggle} aria-label="Toggle">
        {open ? (
          <ChevronUp size={16} strokeWidth={1.6} className="text-muted" />
        ) : (
          <ChevronDown size={16} strokeWidth={1.6} className="text-muted" />
        )}
      </button>
    </div>
  );
}

export function ProfilePage() {
  const { userData, logout } = useAuth();
  const { lang, t } = useI18n();
  const loader = useLoader();
  const { navigateTo } = useNavigator();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [files, setFiles] = useState<ProfileFile[]>([]);

  const [showPersonal, setShowPersonal] = useState(false);
  const [showAddress, setShowAddress] = useState(false);
  const [showAccess, setShowAccess] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [editAddress, setEditAddress] = useState(false);
  const [editAccess, setEditAccess] = useState(false);

  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    loader.show();
    brokerstar
      .contactContactList({ "filters[show_contacts]": 1 })
      .then((response) => {
        const data = (response as { data?: Contact[] })?.data;
        if (!data) return;
        const authId = userData.contact?.id;
        const mapped = data.map((contact) => {
          const contactObject: Contact = { ...contact, id: contact.id };
          if (contact.avatar instanceof Blob) {
            const reader = new FileReader();
            reader.readAsDataURL(contact.avatar);
            reader.onloadend = () => {
              contactObject.img = reader.result as string;
            };
          }
          return contactObject;
        });
        mapped.sort((a, b) => {
          if (a.id === authId) return -1;
          if (b.id === authId) return 1;
          return 0;
        });
        setContacts(mapped);
        setActiveContact(mapped.find((c) => c.id === authId) ?? mapped[0] ?? null);
      })
      .finally(() => loader.hide());
  }, [loader, userData]);

  const setActive = (contactid: number) => {
    setFiles([]);
    setShowDocuments(false);
    setActiveContact(contacts.find((c) => c.id === contactid) ?? null);
  };

  const patchActive = (field: string, value: string) => {
    setActiveContact((c) => (c ? { ...c, [field]: value } : c));
  };

  const loadFiles = useCallback(
    (contactid: number) => {
      loader.show();
      brokerstar
        .contactFiles(String(contactid))
        .then((response) => {
          setFiles(((response as { data?: ProfileFile[] })?.data as ProfileFile[]) || []);
        })
        .finally(() => loader.hide());
    },
    [loader],
  );

  const toggleDocuments = () => {
    const next = !showDocuments;
    setShowDocuments(next);
    if (next && files.length === 0 && activeContact) {
      loadFiles(activeContact.id);
    }
  };

  const updateAddress = async () => {
    if (!activeContact) return;
    loader.show();
    const payload: Record<string, unknown> = {};
    if (isset(activeContact.address)) payload["address"] = activeContact.address;
    if (isset(activeContact.postcode)) payload["postCode"] = activeContact.postcode;
    if (isset(activeContact.city)) payload["city"] = activeContact.city;
    try {
      await brokerstar.changeContact(String(activeContact.id), payload);
      toaster.success(t("profile", "success"));
    } catch (error) {
      toaster.alert(t("profile", "error"));
      console.log(error);
    } finally {
      loader.hide();
    }
  };

  const updatePassword = async () => {
    if (!activeContact) return;
    loader.show();
    try {
      // aggiorna contatto (mail/mobile)
      const profilePayload: Record<string, unknown> = {};
      if (isset(activeContact.mail)) profilePayload["mail"] = activeContact.mail;
      if (isset(activeContact.mobile)) profilePayload["mobile"] = activeContact.mobile;
      await brokerstar.changeContact(String(activeContact.id), profilePayload);
      toaster.success(t("profile", "success"));
      patchActive("currentPassword", "");
      patchActive("password", "");

      // aggiorna login (email) → logout (parità)
      const mePayload: Record<string, unknown> = {};
      if (isset(activeContact.mail, true)) {
        mePayload["login"] = activeContact.mail;
        mePayload["email"] = activeContact.mail;
      }
      if (Object.keys(mePayload).length !== 0) {
        await brokerstar.userMeUpdate(mePayload);
        toaster.success(t("profile", "success"));
        loader.hide();
        await logout();
        navigateTo("login");
        return;
      }

      // aggiorna password → logout (parità)
      const credentialPayload: Record<string, unknown> = {};
      if (isset(activeContact.currentPassword, true)) {
        credentialPayload["currentPassword"] = activeContact.currentPassword;
      }
      if (isset(activeContact.password, true)) {
        credentialPayload["password"] = activeContact.password;
      }
      if (Object.keys(credentialPayload).length !== 0) {
        await brokerstar.changeContactPassword(credentialPayload);
        toaster.success(t("profile", "success"));
        await logout();
        navigateTo("login");
        return;
      }
    } catch (error) {
      toaster.alert(t("profile", "error"));
      console.log(error);
    } finally {
      loader.hide();
    }
  };

  const uploadFile = (file: ProfileFile) => {
    if (!activeContact) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const selectedFile = target.files?.[0];
      if (!selectedFile) return;
      try {
        loader.show();
        await brokerstar.uploadProfileFile(
          {
            currentUploadEntryid: file.id,
            profileid: activeContact.id,
            currentLanguage: lang,
          },
          selectedFile,
        );
        loadFiles(activeContact.id);
      } catch (error) {
        console.log(error);
      } finally {
        loader.hide();
      }
    };
    input.click();
  };

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col px-5 py-6">
      <h1 className="mb-6 text-[28px] font-bold tracking-[-0.7px] text-ink">
        {t("profile.title")}
      </h1>

      {/* Carousel contatti */}
      <HScroll className="-mx-5 px-5">
        <div className="flex gap-4 pb-4">
          {contacts.map((contact) => {
            const active = activeContact?.id === contact.id;
            return (
              <button
                key={contact.id}
                type="button"
                onClick={() => setActive(contact.id)}
                className={clsx(
                  "flex-shrink-0 transition-all duration-200",
                  active ? "mt-0" : "mt-4",
                )}
              >
                <div
                  className={clsx(
                    "flex h-20 w-20 items-center justify-center overflow-hidden rounded-14 border bg-white",
                    active
                      ? "border-brand shadow-card ring-2 ring-tint"
                      : "border-border-soft opacity-60",
                  )}
                >
                  {contact.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={contact.img}
                      alt={contact.name || ""}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound size={28} strokeWidth={1.6} className="text-muted" />
                  )}
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() =>
              activeContact && navigateTo(`link/${activeContact.id}`)
            }
            className="mt-2 flex-shrink-0"
            aria-label="Add profile"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-14 border border-dashed border-border bg-white text-brand transition-colors hover:bg-tint-2">
              <Plus size={22} strokeWidth={1.6} />
            </div>
          </button>
        </div>
      </HScroll>

      {activeContact && (
        <>
          {/* Header contatto attivo */}
          <div className="mb-6 flex items-center justify-between pt-4">
            <h2 className="text-[18px] font-bold tracking-[-0.4px] text-ink">
              {activeContact.name}
            </h2>
            <span className="text-[13px] text-muted">
              {formatDate(activeContact.birthday)}
            </span>
          </div>

          {/* Dati personali */}
          <div className="mb-4">
            <SectionHeader
              title={t("profile.personal")}
              open={showPersonal}
              onToggle={() => setShowPersonal((v) => !v)}
            />
            {showPersonal && (
              <div className="py-3 text-[14.5px] text-ink-2">
                <p className="mb-1">{activeContact.name}</p>
                {activeContact.birthday && <p>{formatDate(activeContact.birthday)}</p>}
              </div>
            )}
          </div>

          {/* Indirizzo */}
          <div className="mb-4">
            <SectionHeader
              title={t("profile.address")}
              open={showAddress || editAddress}
              onToggle={() => setShowAddress((v) => !v)}
              onEdit={() => setEditAddress((v) => !v)}
            />
            {showAddress && !editAddress && (
              <div className="py-3 text-[14.5px] text-ink-2">
                <p className="mb-1">{activeContact.address}</p>
                <p>
                  {activeContact.postcode} {activeContact.city}
                </p>
              </div>
            )}
            {editAddress && (
              <div className="flex flex-col gap-4 py-3">
                <Input
                  label={t("profile.dataaddress")}
                  value={activeContact.address || ""}
                  onChange={(e) => patchActive("address", e.target.value)}
                />
                <Input
                  label={t("profile.datapostcode")}
                  value={activeContact.postcode || ""}
                  onChange={(e) => patchActive("postcode", e.target.value)}
                />
                <Input
                  label={t("profile.datacity")}
                  value={activeContact.city || ""}
                  onChange={(e) => patchActive("city", e.target.value)}
                />
                <Button fullWidth onClick={() => void updateAddress()}>
                  {t("profile.save")}
                </Button>
              </div>
            )}
          </div>

          {/* Dati di accesso */}
          <div className="mb-4">
            <SectionHeader
              title={t("profile.access")}
              open={showAccess || editAccess}
              onToggle={() => setShowAccess((v) => !v)}
              onEdit={() => setEditAccess((v) => !v)}
            />
            {showAccess && !editAccess && (
              <div className="py-3 text-[14.5px] text-ink-2">
                <p className="mb-1">{activeContact.mail}</p>
                <p className="mb-1">{activeContact.mobile}</p>
                <p>********</p>
              </div>
            )}
            {editAccess && (
              <div className="flex flex-col gap-4 py-3">
                <Input
                  label={t("login.email")}
                  type="email"
                  value={activeContact.mail || ""}
                  onChange={(e) => patchActive("mail", e.target.value)}
                />
                <Input
                  label={t("register.mobile")}
                  type="tel"
                  value={activeContact.mobile || ""}
                  onChange={(e) => patchActive("mobile", e.target.value)}
                />
                <Input
                  label={t("profile.datacurrentpassword")}
                  type="password"
                  autoComplete="current-password"
                  value={activeContact.currentPassword || ""}
                  onChange={(e) => patchActive("currentPassword", e.target.value)}
                />
                <Input
                  label={t("profile.datapassword")}
                  type="password"
                  autoComplete="new-password"
                  value={activeContact.password || ""}
                  onChange={(e) => patchActive("password", e.target.value)}
                />
                <Button fullWidth onClick={() => void updatePassword()}>
                  {t("profile.save")}
                </Button>
              </div>
            )}
          </div>

          {/* Documenti */}
          <div className="mb-4">
            <SectionHeader
              title={t("profile.documents")}
              open={showDocuments}
              onToggle={toggleDocuments}
            />
            {showDocuments && (
              <div className="flex flex-col gap-3 py-3">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 rounded-14 bg-tint-2 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-ink">
                        {file.name[lang]}
                      </p>
                      {file.file?.name && (
                        <p className="truncate text-[12.5px] text-muted">
                          {file.file.name}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => uploadFile(file)}
                        className="flex h-9 w-9 items-center justify-center rounded-11 bg-white text-ink-2 transition-colors hover:bg-tint hover:text-brand"
                        aria-label="Upload"
                      >
                        <Upload size={16} strokeWidth={1.6} />
                      </button>
                      {file.file?.id && (
                        <button
                          type="button"
                          onClick={() => navigateTo(`file/${file.file!.id}`)}
                          className="flex h-9 w-9 items-center justify-center rounded-11 bg-brand text-white transition-colors hover:bg-brand-dark"
                          aria-label="Open"
                        >
                          <Download size={16} strokeWidth={1.6} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
