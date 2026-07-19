/** Account admin abilitati al pannello "Gestione consulenti" (doc 2026-05-12). */
export const ADMIN_CONTACT_IDS = [58, 25755];

interface UserDataLike {
  contact?: { id?: number; type?: number; isConsultant?: boolean | number };
  [key: string]: unknown;
}

export function isAdmin(userData: UserDataLike): boolean {
  const id = userData?.contact?.id;
  return id !== undefined && ADMIN_CONTACT_IDS.includes(id);
}
