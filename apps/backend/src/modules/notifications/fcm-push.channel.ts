import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPrivateKey, createSign } from 'node:crypto';
import type { PushChannel, PushSendInput } from './push-channel';
import type { Env } from '@/shared/config/env.schema';

interface GoogleServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  token_uri: string;
}

/**
 * Firebase Cloud Messaging HTTP v1 client. Mints OAuth2 access tokens
 * from a Google service-account JSON, then POSTs one HTTPS request per
 * device token. No `firebase-admin` SDK dep.
 *
 * Active when FCM_SERVICE_ACCOUNT_JSON is set; otherwise NotificationsModule
 * keeps the LogPushChannel binding.
 */
@Injectable()
export class FcmPushChannel implements PushChannel {
  private readonly logger = new Logger(FcmPushChannel.name);
  private readonly serviceAccount: GoogleServiceAccount;
  private cachedToken?: { access_token: string; expiresAtMs: number };

  constructor(config: ConfigService<Env, true>) {
    const raw = config.get('FCM_SERVICE_ACCOUNT_JSON', { infer: true });
    if (!raw) throw new Error('FCM_SERVICE_ACCOUNT_JSON not set');
    this.serviceAccount = JSON.parse(raw) as GoogleServiceAccount;
  }

  async send(input: PushSendInput): Promise<{ sent: number; invalidTokens: string[] }> {
    const accessToken = await this.getAccessToken();
    const endpoint = `https://fcm.googleapis.com/v1/projects/${this.serviceAccount.project_id}/messages:send`;
    let sent = 0;
    const invalid: string[] = [];

    await Promise.all(
      input.tokens.map(async (token) => {
        const body = {
          message: {
            token,
            notification: {
              title: input.titleAr,
              body: input.bodyAr,
            },
            data: {
              ...(input.data ?? {}),
              ...(input.titleEn && { titleEn: input.titleEn }),
              ...(input.bodyEn && { bodyEn: input.bodyEn }),
            },
            android: { priority: 'HIGH' },
          },
        };
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          sent++;
        } else if (res.status === 404 || res.status === 400) {
          // UNREGISTERED / INVALID_ARGUMENT → token is dead.
          invalid.push(token);
        } else {
          const txt = await res.text().catch(() => '');
          this.logger.warn({ status: res.status, body: txt, token }, 'fcm send failed');
        }
      }),
    );

    return { sent, invalidTokens: invalid };
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAtMs - Date.now() > 60_000) {
      return this.cachedToken.access_token;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const payload = base64url(
      JSON.stringify({
        iss: this.serviceAccount.client_email,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: this.serviceAccount.token_uri,
        iat: nowSec,
        exp: nowSec + 3600,
      }),
    );
    const toSign = `${header}.${payload}`;
    const key = createPrivateKey(this.serviceAccount.private_key);
    const sig = createSign('RSA-SHA256').update(toSign).sign(key);
    const jwt = `${toSign}.${base64url(sig)}`;

    const res = await fetch(this.serviceAccount.token_uri, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }).toString(),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(`google token exchange failed: ${res.status} ${txt}`);
    }
    const body = (await res.json()) as { access_token: string; expires_in: number };
    this.cachedToken = {
      access_token: body.access_token,
      expiresAtMs: Date.now() + body.expires_in * 1000,
    };
    return body.access_token;
  }
}

function base64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf.toString('base64').replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
