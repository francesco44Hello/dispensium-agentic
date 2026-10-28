import { LandingPage } from '../../components/landing/LandingPage';

// Public and not behind ProtectedRoute: signed-out visitors and people who just logged out land here.
export default function WelcomePage() {
  return <LandingPage />;
}
