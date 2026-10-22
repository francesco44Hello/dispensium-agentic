import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { RecipesScreen } from "../../components/recipes/RecipesScreen";

export default function Page() {
  return (
    <ProtectedRoute>
      <RecipesScreen />
    </ProtectedRoute>
  );
}
