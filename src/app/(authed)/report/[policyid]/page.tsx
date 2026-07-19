import { ReportPage } from "@/features/policies/ReportPage";

export default async function Page({
  params,
}: {
  params: Promise<{ policyid: string }>;
}) {
  const { policyid } = await params;
  return <ReportPage policyid={policyid} />;
}
