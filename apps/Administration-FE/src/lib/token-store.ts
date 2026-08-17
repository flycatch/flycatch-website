type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

let tokens: TokenPair | null = null;

export function setTokens(accessToken: string, refreshToken: string): void {
  tokens = { accessToken, refreshToken };
}

export function getAccessToken(): string | null {
  return tokens?.accessToken ?? null;
}

export function getRefreshToken(): string | null {
  return tokens?.refreshToken ?? null;
}

export function clearTokens(): void {
  tokens = null;
}

export function hasTokens(): boolean {
  return tokens !== null;
}
