import { PolicyPage } from "@/features/policies/PolicyPage";

export default async function Page({
  params,
}: {
  params: Promise<{ policyid: string }>;
}) {
  const { policyid } = await params;
  return <PolicyPage policyid={policyid} />;
}
