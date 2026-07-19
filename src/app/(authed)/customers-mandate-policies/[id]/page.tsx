import { CustomersMandatePoliciesPage } from "@/features/customers/CustomersMandatePoliciesPage";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomersMandatePoliciesPage id={id} />;
}
