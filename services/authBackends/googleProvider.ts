import { GoogleAuthProvider } from 'firebase/auth';

// prompt: 'select_account' makes Google show the account chooser on every sign-in,
// instead of reusing the account the browser is already signed into.
export function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}
