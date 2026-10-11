import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const memory = new Map<string, string>();

describe('microsoft sign-in callback', () => {
  beforeEach(() => {
    memory.clear();
    vi.resetModules();
    vi.stubGlobal('sessionStorage', {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('stores a fragment token pair and removes access_token from the address', async () => {
    const { consumeMicrosoftSignIn } = await import('../../src/lib/microsoft-sign-in');
    const { getAccessToken, getRefreshToken } = await import('../../src/lib/token-store');
    let address = '/admin/sign-in/microsoft/#access_token=access-1&refresh_token=refresh-1&expires_in=900';
    const location = {
      hash: '#access_token=access-1&refresh_token=refresh-1&expires_in=900',
      pathname: '/admin/sign-in/microsoft/',
      search: '',
    } as Location;
    const history = {
      replaceState: (_state: null, _title: string, url: string) => {
        address = url;
      },
    } as History;

    expect(consumeMicrosoftSignIn(location, history)).toBe(true);
    expect(getAccessToken()).toBe('access-1');
    expect(getRefreshToken()).toBe('refresh-1');
    expect(address).toBe('/admin/');
    expect(address).not.toContain('access_token');
  });

  it('navigates to a same-site /admin/ return path and ignores anything else', async () => {
    const { consumeMicrosoftSignIn } = await import('../../src/lib/microsoft-sign-in');
    const run = (next: string) => {
      let address = '';
      const hash = `#access_token=a&refresh_token=r&next=${encodeURIComponent(next)}`;
      const location = { hash, pathname: '/admin/sign-in/microsoft/', search: '' } as Location;
      const history = {
        replaceState: (_s: null, _t: string, url: string) => {
          address = url;
        },
      } as History;
      consumeMicrosoftSignIn(location, history);
      return address;
    };

    expect(run('/admin/blogs/?page=2')).toBe('/admin/blogs/?page=2');
    expect(run('https://evil.example/admin/')).toBe('/admin/');
    expect(run('//evil.example')).toBe('/admin/');
    expect(run('/admin//evil.example')).toBe('/admin/');
  });

  it('reads the generic sign-in error query', async () => {
    const { signInErrorKey } = await import('../../src/lib/microsoft-sign-in');
    expect(signInErrorKey('?error=admin.sign_in.error')).toBe('admin.sign_in.error');
    expect(signInErrorKey('?error=other')).toBeNull();
  });
});
