import type { APIRoute } from 'astro';
import { followShortLink } from '../../../../lib/careers-link';

export const prerender = false;

export const GET: APIRoute = (context) => followShortLink(context, context.params.code);
