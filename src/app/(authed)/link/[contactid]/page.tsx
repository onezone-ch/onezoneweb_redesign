import { RegisterPage } from "@/features/auth/RegisterPage";

export default async function Page({
  params,
}: {
  params: Promise<{ contactid: string }>;
}) {
  await params;
  return <RegisterPage link />;
}
