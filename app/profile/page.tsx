import { ProfileScreen } from '../../components/profile/ProfileScreen';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { AppShell } from '../../components/AppShell';

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ProfileScreen />
      </AppShell>
    </ProtectedRoute>
  );
}
