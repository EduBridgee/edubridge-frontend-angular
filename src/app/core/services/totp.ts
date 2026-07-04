import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TotpService {

  private base32Decode(base32: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    base32 = base32.toUpperCase().replace(/=+$/, '');
    const length = base32.length;
    const buffer = new Uint8Array(Math.floor((length * 5) / 8));
    let bits = 0;
    let value = 0;
    let index = 0;

    for (let i = 0; i < length; i++) {
      const val = alphabet.indexOf(base32.charAt(i));
      if (val === -1) continue;
      value = (value << 5) | val;
      bits += 5;
      if (bits >= 8) {
        buffer[index++] = (value >>> (bits - 8)) & 255;
        bits -= 8;
      }
    }
    return buffer;
  }

  async generateTotp(secretBase32: string, timeOffsetWindows: number = 0): Promise<string> {
    const keyBytes = this.base32Decode(secretBase32);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30) + timeOffsetWindows;

    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, BigInt(counter), false);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes as any,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const hmacBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, buffer);
    const hmac = new Uint8Array(hmacBuffer);
    const offset = hmac[hmac.length - 1] & 0x0f;

    const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    );

    return (code % 1000000).toString().padStart(6, '0');
  }

  async verifyTotp(token: string, secretBase32: string): Promise<boolean> {
    if (!token || token.length !== 6 || isNaN(Number(token))) {
      return false;
    }
    for (let i = -1; i <= 1; i++) {
      const code = await this.generateTotp(secretBase32, i);
      if (code === token) {
        return true;
      }
    }
    return false;
  }

  generateRandomSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      secret += chars[idx];
    }
    return secret;
  }
}
