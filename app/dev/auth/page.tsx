import { notFound } from "next/navigation";
import { AuthTestPanel } from "../../../components/dev/AuthTestPanel";

export default function DevAuthPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="viewport">
      <AuthTestPanel />
    </main>
  );
}
