import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { AppShell } from "../components/AppShell";
import { GroceryScreen } from "../components/groceries/GroceryScreen";

export default function Home() {
  return (
    <ProtectedRoute>
      <AppShell>
        <GroceryScreen />
      </AppShell>
    </ProtectedRoute>
  );
}
