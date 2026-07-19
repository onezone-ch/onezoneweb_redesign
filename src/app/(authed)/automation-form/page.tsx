import { Suspense } from "react";
import { AutomationFormPage } from "@/features/automation-form/AutomationFormPage";

export default function Page() {
  return (
    <Suspense>
      <AutomationFormPage />
    </Suspense>
  );
}
