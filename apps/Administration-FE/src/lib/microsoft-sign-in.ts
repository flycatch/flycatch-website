import { setTokens } from './token-store';

export function signInErrorKey(search: string): string | null {
  const key = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search).get('error');
  return key === 'admin.sign_in.error' ? key : null;
}

export function consumeMicrosoftSignIn(location: Location, history: History): boolean {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (!accessToken || !refreshToken) return false;
  setTokens(accessToken, refreshToken);
  const next = location.pathname.includes('/sign-in/microsoft')
    ? '/admin/'
    : `${location.pathname}${location.search}`;
  history.replaceState(null, '', next);
  return true;
}
