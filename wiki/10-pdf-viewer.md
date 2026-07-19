# Sezione PDF / Documenti

## FileViewer — `/file/:fileid` e `/jasper/:reportName/:contactId`

[src/features/pdf/FileViewerPage.tsx](../src/features/pdf/FileViewerPage.tsx) · rotte [src/app/(pdf)/file/[fileid]/page.tsx](../src/app/%28pdf%29/file/%5Bfileid%5D/page.tsx) e [src/app/(pdf)/jasper/[reportName]/[contactId]/page.tsx](../src/app/%28pdf%29/jasper/%5BreportName%5D/%5BcontactId%5D/page.tsx)

Un unico componente, due modalità:
- **`/file/:fileid`**: `fileInfo` (mime/estensione) + `file` (blob) → FileReader dataURL → `<iframe>` se PDF, `<img>` se immagine (png/jpe?g/gif/bmp/heic/heif), altrimenti "not supported".
- **`/jasper/:reportName/:contactId`**: `createJasperreport(returnBase64)` → `data:application/pdf;base64,...` in iframe. Report usati: `Brokermandat{,EN,IT,FR}` (da /agreement).

**Fix anti-flash (doc 2026-02-11)**: lo stato iniziale è `loading` (spinner) — il messaggio "not supported" appare solo dopo che il file è stato risolto davvero.

Layout: [src/components/layout/PdfShell.tsx](../src/components/layout/PdfShell.tsx) — header minimale con solo il back.

⚠️ Da testare su Safari/iOS: il comportamento dataURL→iframe varia tra browser (utenza mobile-first).
