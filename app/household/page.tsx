import { HouseholdScreen } from '../../components/household/HouseholdScreen';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { AppShell } from '../../components/AppShell';

export default function HouseholdPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <HouseholdScreen />
      </AppShell>
    </ProtectedRoute>
  );
}
