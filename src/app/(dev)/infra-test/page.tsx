import { notFound } from "next/navigation";
import { InfraTest } from "./InfraTest";

export default function InfraTestPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <InfraTest />;
}
