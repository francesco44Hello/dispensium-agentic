import { Suspense } from "react";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import { RecipeDetailScreen } from "../../../components/recipes/RecipeDetailScreen";

// Reads the id from the URL. Each recipe is private household data, so it is rendered per request, never prerendered.
async function RecipeFromParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecipeDetailScreen id={id} />;
}

export default function Page({ params }: PageProps<"/recipes/[id]">) {
  return (
    <ProtectedRoute>
      <Suspense fallback={<p role="status">Loading recipe…</p>}>
        <RecipeFromParams params={params} />
      </Suspense>
    </ProtectedRoute>
  );
}
