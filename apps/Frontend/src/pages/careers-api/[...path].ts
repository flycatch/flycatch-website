import type { APIRoute } from 'astro';
import { proxyCareers } from '../../lib/careers-proxy';

export const prerender = false;

const handle: APIRoute = ({ request, params, clientAddress }) => {
  let address: string | undefined;
  try {
    address = clientAddress;
  } catch {
    address = undefined;
  }
  return proxyCareers(request, params.path ?? '', address);
};

export const GET = handle;
export const POST = handle;
