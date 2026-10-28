import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import { NewRecipeScreen } from "../../../components/recipes/NewRecipeScreen";

export default function Page() {
  return (
    <ProtectedRoute>
      <NewRecipeScreen />
    </ProtectedRoute>
  );
}
