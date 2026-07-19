import { RegisterPage } from "@/features/auth/RegisterPage";

export default async function Page({
  params,
}: {
  params: Promise<{ consultantCode?: string[] }>;
}) {
  const { consultantCode } = await params;
  return <RegisterPage consultantCode={consultantCode?.[0] ?? ""} />;
}
