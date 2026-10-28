import { LandingPage } from '../../components/landing/LandingPage';

// Public and not behind ProtectedRoute: signed-out visitors land here. Review route for the new landing design.
export default function WelcomePage() {
  return <LandingPage />;
}
