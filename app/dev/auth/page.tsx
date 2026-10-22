import { notFound } from "next/navigation";

export default async function DevAuthPage() {
  // The panel is imported only inside this branch. In a production build the condition is constant, so the minifier
  // drops the import and the panel code is not in the production bundle.
  if (process.env.NODE_ENV !== "production") {
    const { AuthTestPanel } = await import("../../../components/dev/AuthTestPanel");
    return (
      <main className="viewport">
        <AuthTestPanel />
      </main>
    );
  }
  notFound();
}
