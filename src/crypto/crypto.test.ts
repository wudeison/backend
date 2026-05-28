import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from './crypto';

describe('encriptación', () => {
  it('round-trip: decrypt(encrypt(x)) = x', () => {
    const original = 'documento-12345';

    const cifrado = encrypt(original);

    expect(cifrado).not.toBe(original);
    expect(decrypt(cifrado)).toBe(original);
  });

  it('dos cifrados del mismo texto son diferentes (IV aleatorio)', () => {
    const a = encrypt('hola');
    const b = encrypt('hola');

    expect(a).not.toBe(b);
  });
});