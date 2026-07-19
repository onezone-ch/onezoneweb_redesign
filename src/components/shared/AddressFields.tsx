"use client";

/**
 * Campi CAP → Località → Via con dropdown autocomplete e ARIA combobox/listbox.
 * Ordine dei campi come da doc 2026-06-17. Da usare con useAddressAutocomplete.
 */

import clsx from "clsx";
import { Input } from "@/components/ui";
import type { AddressAutocomplete, DropdownKind } from "./useAddressAutocomplete";
import type { LocalityEntry, StreetEntry } from "@/lib/api/automation.types";

function Dropdown<T>({
  items,
  activeIndex,
  onSelect,
  render,
  kind,
}: {
  items: T[];
  activeIndex: number;
  onSelect: (item: T) => void;
  render: (item: T) => string;
  kind: DropdownKind;
}) {
  return (
    <ul
      role="listbox"
      id={`listbox-${kind}`}
      className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-12 border border-border-soft bg-white shadow-float"
    >
      {items.map((item, i) => (
        <li
          key={`${render(item)}-${i}`}
          role="option"
          aria-selected={i === activeIndex}
          className={clsx(
            "cursor-pointer border-t border-border-soft px-[14px] py-[10px] text-[14px] first:border-t-0",
            i === activeIndex ? "bg-tint text-brand" : "hover:bg-tint-2",
          )}
          // mousedown per battere il blur dell'input
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(item);
          }}
        >
          {render(item)}
        </li>
      ))}
    </ul>
  );
}

export interface AddressFieldsProps {
  ac: AddressAutocomplete;
  labels: { zip: string; city: string; address: string };
  errors?: { postCode?: string; city?: string; address?: string };
  /** Hint mostrato sotto la via quando CAP+località non sono ancora validi */
  addressHint?: string;
}

export function AddressFields({ ac, labels, errors = {}, addressHint }: AddressFieldsProps) {
  const comboProps = (kind: DropdownKind) => ({
    role: "combobox" as const,
    "aria-expanded": ac.openDropdown === kind,
    "aria-controls": `listbox-${kind}`,
    "aria-autocomplete": "list" as const,
    autoComplete: "off",
  });

  return (
    <>
      <div className="relative">
        <Input
          label={labels.zip}
          value={ac.values.postCode}
          error={errors.postCode}
          inputMode="numeric"
          maxLength={4}
          onChange={(e) => ac.onPlzInput(e.target.value)}
          onKeyDown={(e) => ac.onKeyDown(e, "plz")}
          onBlur={ac.closeSoon}
          {...comboProps("plz")}
        />
        {ac.openDropdown === "plz" && (
          <Dropdown<LocalityEntry>
            kind="plz"
            items={ac.plzSuggestions}
            activeIndex={ac.activeIndex}
            onSelect={ac.selectPlz}
            render={(l) => `${l.plz} ${l.locality} (${l.canton})`}
          />
        )}
      </div>

      <div className="relative">
        <Input
          label={labels.city}
          value={ac.values.city}
          error={errors.city}
          onFocus={ac.onAreaFocus}
          onChange={(e) => ac.onAreaInput(e.target.value)}
          onKeyDown={(e) => ac.onKeyDown(e, "area")}
          onBlur={ac.closeSoon}
          {...comboProps("area")}
        />
        {ac.openDropdown === "area" && (
          <Dropdown<LocalityEntry>
            kind="area"
            items={ac.areaSuggestions}
            activeIndex={ac.activeIndex}
            onSelect={ac.selectArea}
            render={(l) => `${l.locality} (${l.canton})`}
          />
        )}
      </div>

      <div className="relative">
        <Input
          label={labels.address}
          value={ac.values.address}
          error={errors.address}
          onChange={(e) => ac.onAddressInput(e.target.value)}
          onKeyDown={(e) => ac.onKeyDown(e, "address")}
          onBlur={ac.closeSoon}
          {...comboProps("address")}
        />
        {ac.addressLoading && (
          <span className="absolute right-3 top-[38px] h-4 w-4 animate-spin rounded-full border-2 border-tint border-t-brand" />
        )}
        {ac.openDropdown === "address" && (
          <Dropdown<StreetEntry>
            kind="address"
            items={ac.streetSuggestions}
            activeIndex={ac.activeIndex}
            onSelect={ac.selectStreet}
            render={(s) => s.name}
          />
        )}
        {addressHint && !ac.canQueryStreets() && (
          <p className="mt-[6px] text-[12px] text-muted">{addressHint}</p>
        )}
      </div>
    </>
  );
}
