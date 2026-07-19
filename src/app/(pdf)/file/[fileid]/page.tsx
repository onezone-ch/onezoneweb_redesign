import { FileViewerPage } from "@/features/pdf/FileViewerPage";

export default async function Page({
  params,
}: {
  params: Promise<{ fileid: string }>;
}) {
  const { fileid } = await params;
  return <FileViewerPage fileid={fileid} />;
}
