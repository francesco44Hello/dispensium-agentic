import { AppShell } from "../../components/AppShell";
import { PlaceholderPage } from "../../components/PlaceholderPage";
import { ProtectedRoute } from "../../components/auth/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute>
      <AppShell>
        <PlaceholderPage title="Plan the week" />
      </AppShell>
    </ProtectedRoute>
  );
}
