"use client";

import { useState } from "react";
import {
  Shield,
  Sparkles,
  User,
  Car,
  Search,
  Download,
  FileText,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Eyebrow,
  Input,
  ListCard,
  ListRow,
  Modal,
  Segmented,
  Select,
  Spinner,
  StatusDot,
  StepBar,
  Textarea,
} from "@/components/ui";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border-soft px-6 py-10 sm:px-12">
      <Eyebrow tone="brand" className="mb-6">
        {title}
      </Eyebrow>
      {children}
    </section>
  );
}

export function KitchenSink() {
  const [seg, setSeg] = useState<"person" | "company">("person");
  const [tab, setTab] = useState<"pending" | "accepted" | "declined">("pending");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="mx-auto w-full max-w-[1080px] pb-24">
      <header className="border-b border-border px-6 py-12 sm:px-12">
        <Eyebrow tone="brand" className="mb-4 inline-block rounded-[6px] bg-tint px-[10px] py-[5px]">
          Kitchen sink
        </Eyebrow>
        <h1 className="text-[32px] font-bold leading-[1.02] tracking-[-1px]">
          OneZone UI Kit
        </h1>
        <p className="mt-3 max-w-[560px] text-[15px] font-medium text-ink-2">
          Confronto visivo con il design system. Solo dev — 404 in produzione.
        </p>
      </header>

      <Section title="Tipografia">
        <div className="flex flex-col gap-4">
          <div className="text-[32px] font-bold tracking-[-1px]">Bentornato.</div>
          <div className="text-[28px] font-bold tracking-[-0.7px]">Le mie polizze</div>
          <div className="text-[18px] font-bold tracking-[-0.4px]">VW Golf · TI 123 456</div>
          <div className="text-[15px] font-medium">Accedi al tuo portale assicurativo.</div>
          <div className="text-[13px] text-ink-2">Cliente dal 14 marzo 2021</div>
          <Eyebrow>Attività</Eyebrow>
        </div>
      </Section>

      <Section title="Bottoni">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Accedi</Button>
          <Button variant="secondary">Contatta consulente</Button>
          <Button variant="ghost" icon={<Search size={16} strokeWidth={1.6} />}>
            Cerca veicolo
          </Button>
          <Button variant="danger">Disconnetti</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Accetta</Button>
          <Button size="sm" variant="secondary">
            Rifiuta
          </Button>
          <Button size="sm" variant="ghost" icon={<Download size={14} strokeWidth={1.6} />}>
            Scarica
          </Button>
          <Button disabled>Disabilitato</Button>
        </div>
      </Section>

      <Section title="Form">
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="EMAIL" defaultValue="marco.rossi@email.ch" />
          <Input label="PASSWORD" type="password" defaultValue="segretissimo" />
          <Input label="CAP" placeholder="Obbligatorio" error="Campo obbligatorio" />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Select label="LINGUA" defaultValue="it">
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="it">Italiano</option>
            <option value="en">English</option>
          </Select>
          <Textarea label="DESCRIZIONE" placeholder="Descrivi l'accaduto…" className="sm:col-span-2" />
        </div>
        <div className="mt-6 flex items-center gap-4">
          <Segmented
            options={[
              { value: "person", label: "Persona" },
              { value: "company", label: "Azienda" },
            ]}
            value={seg}
            onChange={setSeg}
          />
          <span className="text-[12.5px] text-muted">Selettore segmentato — registrazione, form mandato.</span>
        </div>
      </Section>

      <Section title="Badge & stati">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Consulente</Badge>
          <Badge variant="success">Mandato</Badge>
          <Badge variant="danger">Disabilitato</Badge>
          <Badge variant="warn">In attesa</Badge>
          <Badge variant="solid">2</Badge>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-6">
          <StatusDot status="success">Login attivo</StatusDot>
          <StatusDot status="muted">Scraper spento</StatusDot>
          <StatusDot status="danger">Errore</StatusDot>
        </div>
      </Section>

      <Section title="Navigazione">
        <div className="max-w-[420px]">
          <Segmented
            fullWidth
            options={[
              { value: "pending", label: "Sospese", count: 2 },
              { value: "accepted", label: "Accettate", count: 8 },
              { value: "declined", label: "Rifiutate", count: 1 },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <StepBar steps={5} current={2} className="mt-6" />
        <p className="mt-3 text-[12.5px] text-muted">
          Progress a 5 segmenti — AutomationForm. Pieno per completati, 40% per l&apos;attivo.
        </p>
      </Section>

      <Section title="Liste & card">
        <div className="grid items-start gap-5 sm:grid-cols-2">
          <ListCard className="max-w-[380px]">
            <ListRow
              icon={<Shield size={18} strokeWidth={1.6} />}
              title="Le mie polizze"
              subtitle="7 attive"
              onClick={() => {}}
            />
            <ListRow
              icon={<Sparkles size={18} strokeWidth={1.6} />}
              title="Offerte e preventivi"
              subtitle="2 da rivedere"
              subtitleAccent
              onClick={() => {}}
            />
            <ListRow
              icon={<User size={18} strokeWidth={1.6} />}
              title="Il mio consulente"
              subtitle="Anna Bianchi"
              onClick={() => {}}
            />
          </ListCard>
          <div className="flex flex-col gap-5">
            <Card>
              <div className="text-[18px] font-bold tracking-[-0.4px]">Card semplice</div>
              <p className="mt-1 text-[13px] text-ink-2">Bianco, bordo soft, radius 16.</p>
            </Card>
            <Card floating>
              <div className="text-[18px] font-bold tracking-[-0.4px]">Card flottante</div>
              <p className="mt-1 text-[13px] text-ink-2">Con ombra card — promo, drop-zone.</p>
            </Card>
          </div>
        </div>
      </Section>

      <Section title="Modal, loader, empty state">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost" onClick={() => setModalOpen(true)}>
            Apri modal
          </Button>
          <Spinner />
          <Spinner size={32} />
        </div>
        <Card className="mt-5 max-w-[420px]">
          <EmptyState
            icon={<FileText size={24} strokeWidth={1.6} />}
            title="Nessuna polizza"
            description="Quando aggiungi una polizza la troverai qui."
            action={<Button size="sm">Aggiungi polizza</Button>}
          />
        </Card>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Cerca veicolo">
          <div className="flex flex-col gap-4">
            <Input label="MARCA" placeholder="VW" />
            <Input label="MODELLO" placeholder="Golf" />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>
                Annulla
              </Button>
              <Button size="sm" icon={<Car size={14} strokeWidth={1.6} />}>
                Cerca
              </Button>
            </div>
          </div>
        </Modal>
      </Section>
    </main>
  );
}
