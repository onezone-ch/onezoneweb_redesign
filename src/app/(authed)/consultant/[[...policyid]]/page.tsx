import { ConsultantPage } from "@/features/offers/ConsultantPage";

export default async function Page({
  params,
}: {
  params: Promise<{ policyid?: string[] }>;
}) {
  const { policyid } = await params;
  return <ConsultantPage policyid={policyid?.[0]} />;
}
