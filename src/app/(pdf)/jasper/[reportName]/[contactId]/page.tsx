import { FileViewerPage } from "@/features/pdf/FileViewerPage";

export default async function Page({
  params,
}: {
  params: Promise<{ reportName: string; contactId: string }>;
}) {
  const { reportName, contactId } = await params;
  return <FileViewerPage reportName={reportName} contactId={contactId} />;
}
