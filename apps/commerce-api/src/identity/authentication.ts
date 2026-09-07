import { createPublicKey, KeyObject } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { ConfigurationError, DatabaseFailure, RuntimeConfig } from '@luic/platform';

export type ActorKind = 'customer' | 'staff';
export interface VerifiedIdentity { readonly issuer: string; readonly subject: string; readonly kind: ActorKind }
export interface IdentityVerifier { verify(header: string | undefined, kind: ActorKind): VerifiedIdentity }
export const LOCAL_ISSUER = 'urn:luic:synthetic:local';
export const audience = (kind: ActorKind): string => 'urn:luic:synthetic:' + kind;

// Only public verification material enters the API. No JWKS/network fallback or signing endpoint.
export class LocalIdentityVerifier implements IdentityVerifier {
  private readonly key: KeyObject | undefined;
  constructor(config: RuntimeConfig, publicKeyBase64?: string) {
    if (!['local', 'test'].includes(config.environment) || config.identityMode !== 'synthetic')
      throw new ConfigurationError(['IDENTITY_MODE']);
    if (publicKeyBase64 !== undefined) {
      try {
        if (publicKeyBase64.length > 4096 || !/^[A-Za-z0-9+/]+={0,2}$/.test(publicKeyBase64)) throw new Error();
        const pem = Buffer.from(publicKeyBase64, 'base64').toString('utf8');
        if (!pem.startsWith('-----BEGIN PUBLIC KEY-----')) throw new Error();
        const key = createPublicKey(pem);
        if (key.asymmetricKeyType !== 'rsa' || (key.asymmetricKeyDetails?.modulusLength ?? 0) < 2048) throw new Error();
        this.key = key;
      } catch { throw new ConfigurationError(['IDENTITY_PUBLIC_KEY']); }
    }
  }
  verify(header: string | undefined, kind: ActorKind): VerifiedIdentity {
    try {
      if (!this.key || !header || header.length > 8192 || !/^Bearer [A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(header)) throw new Error();
      const token = jwt.verify(header.slice(7), this.key, { algorithms: ['RS256'],
        issuer: LOCAL_ISSUER, audience: audience(kind), clockTolerance: 0, maxAge: 300, complete: true });
      const p = token.payload;
      const now = Math.floor(Date.now() / 1000);
      if (typeof p === 'string' || token.header.typ !== 'JWT' || token.header.kid !== 'local-rsa-1' ||
        token.header.jku || 'jwk' in token.header || token.header.crit ||
        p.aud !== audience(kind) || p.kind !== kind || p.synthetic !== true ||
        typeof p.sub !== 'string' || !/^synthetic:[A-Za-z0-9._-]{1,100}$/.test(p.sub) ||
        !Number.isSafeInteger(p.iat) || !Number.isSafeInteger(p.exp) || !Number.isSafeInteger(p.nbf) ||
        p.iat! > now || p.exp! <= p.iat! || p.exp! - p.iat! > 300 || p.nbf! > p.exp! ||
        p.scope !== kind + ':access' || (kind === 'staff' && (!Array.isArray(p.amr) || !p.amr.includes('mfa')))) throw new Error();
      return Object.freeze({ issuer: LOCAL_ISSUER, subject: p.sub, kind });
    } catch { throw new DatabaseFailure('UNAUTHORIZED'); }
  }
}
