/// <reference types="astro/client" />
import type { AstroUserConfig } from 'astro';

declare global {
  namespace ImportMeta {
    interface Env {
      readonly PUBLIC_ORIGIN: string;
      readonly PUBLIC_PORTAL_URL?: string;
    }
  }
}

export default {} satisfies AstroUserConfig;
