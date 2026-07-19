import { OffersPage } from "@/features/offers/OffersPage";

export default async function Page({
  params,
}: {
  params: Promise<{ offerid?: string[] }>;
}) {
  const { offerid } = await params;
  return <OffersPage offerid={offerid?.[0]} />;
}
