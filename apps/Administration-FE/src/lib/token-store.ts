type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

const STORAGE_KEY = 'flycatch.admin.tokens';

let tokens: TokenPair | null | undefined;

function readStored(): TokenPair | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<TokenPair>;
    if (typeof parsed.accessToken === 'string' && typeof parsed.refreshToken === 'string') {
      return { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
    }
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
  }
  return null;
}

function writeStored(value: TokenPair | null): void {
  if (typeof sessionStorage === 'undefined') return;
  if (value) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

function loaded(): TokenPair | null {
  if (tokens === undefined) {
    tokens = readStored();
  }
  return tokens;
}

export function setTokens(accessToken: string, refreshToken: string): void {
  tokens = { accessToken, refreshToken };
  writeStored(tokens);
}

export function getAccessToken(): string | null {
  return loaded()?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return loaded()?.refreshToken ?? null;
}

export function clearTokens(): void {
  tokens = null;
  writeStored(null);
}

export function hasTokens(): boolean {
  return loaded() !== null;
}
