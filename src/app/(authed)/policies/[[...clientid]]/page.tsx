import { PoliciesPage } from "@/features/policies/PoliciesPage";

export default async function Page({
  params,
}: {
  params: Promise<{ clientid?: string[] }>;
}) {
  const { clientid } = await params;
  return <PoliciesPage clientid={clientid?.[0]} />;
}
