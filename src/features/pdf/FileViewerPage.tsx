"use client";

/**
 * Port di file.component — viewer fullscreen per:
 * - /file/:fileid → fileInfo + download blob → dataURL → iframe (pdf),
 *   img (immagini) o stato "not supported";
 * - /jasper/:reportName/:contactId → createJasperreport → base64 pdf.
 * Stato iniziale 'loading' finché il file non è risolto: niente flash
 * del messaggio "Not supported" (fix doc 2026-02-11).
 */

import { useEffect, useRef, useState } from "react";
import { FileX } from "lucide-react";
import { EmptyState, Spinner } from "@/components/ui";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useLoader } from "@/lib/loader/LoaderProvider";
import * as brokerstar from "@/lib/api/brokerstar";
import { toaster } from "@/lib/toaster";

type FileType = "pdf" | "image" | "other" | "loading";

interface FileInfo {
  mimeType?: string;
  extension?: string;
}

const IMAGE_MIMES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/bmp", "image/heic", "image/heif"];
const IMAGE_EXTS = ["png", "jpeg", "jpg", "gif", "bmp", "heic", "heif"];

function isPdf(info: FileInfo): boolean {
  return (
    info.mimeType === "application/pdf" ||
    String(info.extension).toLowerCase() === "pdf"
  );
}

function isImage(info: FileInfo): boolean {
  return (
    IMAGE_MIMES.includes(info.mimeType ?? "") ||
    IMAGE_EXTS.includes(String(info.extension).toLowerCase())
  );
}

export function FileViewerPage({
  fileid,
  reportName,
  contactId,
}: {
  fileid?: string;
  reportName?: string;
  contactId?: string;
}) {
  const { t } = useI18n();
  const loader = useLoader();

  const [filetype, setFiletype] = useState<FileType>("loading");
  const [url, setUrl] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const loadFile = async (id: string) => {
      loader.show();
      try {
        const info = (await brokerstar.fileInfo(id)) as FileInfo | undefined;
        if (!info) return;
        const blob = await brokerstar.file(id);
        if (!blob) return;
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          if (isPdf(info)) {
            setFiletype("pdf");
            setUrl(dataUrl);
          } else if (isImage(info)) {
            setFiletype("image");
            setUrl(dataUrl);
          } else {
            setFiletype("other");
          }
        };
      } finally {
        loader.hide();
      }
    };

    const loadJasper = async (report: string, contact: string) => {
      loader.show();
      setFiletype("pdf");
      try {
        const response = (await brokerstar.createJasperreport(report, contact)) as {
          fileBase64?: string;
        };
        if (response?.fileBase64) {
          setUrl(`data:application/pdf;base64,${response.fileBase64}`);
        } else {
          toaster.warn("Error generating report");
        }
      } catch (error) {
        console.log(error);
        toaster.warn("Error generating report");
      } finally {
        loader.hide();
      }
    };

    if (fileid) void loadFile(fileid);
    else if (reportName && contactId) void loadJasper(reportName, contactId);
  }, [fileid, reportName, contactId, loader]);

  if (filetype === "loading") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3">
        <Spinner size={28} />
        <p className="text-[13.5px] text-muted">{t("file.loading")}</p>
      </div>
    );
  }

  if (filetype === "other") {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<FileX size={24} strokeWidth={1.6} />}
          title={t("file.notsupported")}
        />
      </div>
    );
  }

  if (filetype === "image") {
    return (
      <div className="flex h-full items-center justify-center overflow-auto p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  return url ? (
    <iframe src={url} title="PDF" className="h-full w-full border-0" />
  ) : (
    <div className="flex h-full items-center justify-center">
      <Spinner size={28} />
    </div>
  );
}
