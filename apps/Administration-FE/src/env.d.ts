import type { AstroUserConfig } from 'astro';

declare global {
  namespace ImportMeta {
    interface Env {
      readonly PUBLIC_ORIGIN: string;
    }
  }
}

export default {} satisfies AstroUserConfig;
