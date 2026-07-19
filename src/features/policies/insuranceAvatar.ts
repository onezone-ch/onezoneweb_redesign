"use client";

/** Carica l'avatar (logo assicurazione/contatto) come dataURL — port del pattern Blob→FileReader. */

import { contactGetAvatar } from "@/lib/api/brokerstar";

export async function loadAvatarDataUrl(contactId: number): Promise<string | null> {
  const avatar = await contactGetAvatar(contactId);
  if (!(avatar instanceof Blob)) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(avatar);
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
  });
}
