import { ProtectedRoute } from "../../components/auth/ProtectedRoute";
import { MenuScreen } from "../../components/menu/MenuScreen";

export default function Page() {
  return (
    <ProtectedRoute>
      <MenuScreen />
    </ProtectedRoute>
  );
}
