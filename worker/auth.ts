import { getStaffIdentity } from './staff';
import { GuestTokenPayload } from './types';
import { AvatarCustomization, ParticipantType } from '../src/types';

// Memory moderation reads the same durable room as public visitors. Resolve
// staff permissions from verified Supabase identity, never client role claims.
export async function verifyStaffRole(
  token: string,
  supabaseUrl?: string,
  serviceKey?: string,
): Promise<'teacher' | 'admin' | null> {
  const identity = await getStaffIdentity(token, { SUPABASE_URL: supabaseUrl, SUPABASE_SERVICE_ROLE_KEY: serviceKey });
  return identity?.role === 'admin' || identity?.role === 'teacher' ? identity.role : null;
}

// Default fallback secret for development; in production should be set in Cloudflare Secrets (JWT_SECRET)
const DEFAULT_SECRET = 'lop-hoc-ky-uc-2026-secret-salt-key-928172648';

/**
 * Generate a cryptographically random, unguessable guest session ID
 */
export function generateGuestSessionId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return 'gst_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get CryptoKey for HMAC-SHA256 signing/verification
 */
async function getCryptoKey(secret: string = DEFAULT_SECRET): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Convert ArrayBuffer to URL-safe Base64
 */
function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Convert URL-safe Base64 to Uint8Array
 */
function base64UrlToBuffer(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Create a signed Guest Session Token (HMAC-SHA256)
 */
export async function createGuestToken(
  sessionId: string,
  displayName: string,
  participantType: ParticipantType,
  avatar: AvatarCustomization,
  secret: string = DEFAULT_SECRET,
  ttlMs: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<string> {
  const now = Date.now();
  const payload: GuestTokenPayload = {
    sub: sessionId,
    name: displayName.trim().slice(0, 32),
    type: participantType === 'student' ? 'student' : 'guest',
    role: 'member', // Strictly enforced! Visitors can NEVER have admin/teacher role
    avatar,
    iat: now,
    exp: now + ttlMs,
  };

  const header = { alg: 'HS256', typ: 'JWT' };
  const enc = new TextEncoder();

  const encodedHeader = bufferToBase64Url(enc.encode(JSON.stringify(header)));
  const encodedPayload = bufferToBase64Url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const key = await getCryptoKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, enc.encode(signingInput));
  const encodedSignature = bufferToBase64Url(signature);

  return `${signingInput}.${encodedSignature}`;
}

/**
 * Verify a Guest Session Token
 */
export async function verifyGuestToken(
  token: string,
  secret: string = DEFAULT_SECRET
): Promise<GuestTokenPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const enc = new TextEncoder();

    const key = await getCryptoKey(secret);
    const signatureBytes = base64UrlToBuffer(encodedSignature);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      enc.encode(signingInput)
    );

    if (!isValid) return null;

    const dec = new TextDecoder();
    const payloadStr = dec.decode(base64UrlToBuffer(encodedPayload));
    const payload: GuestTokenPayload = JSON.parse(payloadStr);

    // Verify expiration
    if (Date.now() > payload.exp) {
      return null;
    }

    // Security: visitor role must strictly be 'member'
    if (payload.role !== 'member') {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract claims from a Supabase Auth access_token (JWT)
 */
export function decodeSupabaseToken(token: string): { sub: string; email?: string; role?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const dec = new TextDecoder();
    const payloadStr = dec.decode(base64UrlToBuffer(parts[1]));
    const payload = JSON.parse(payloadStr);

    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

