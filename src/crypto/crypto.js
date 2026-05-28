const crypto = require("crypto");

// ⚠️ clave fija SOLO para práctica/test (en producción va en .env)
const KEY = Buffer.alloc(32, 1);

function encrypt(text) {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);

  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // guardamos iv + authTag + data en un solo string
  return Buffer.concat([iv, authTag, encrypted]).toString("hex");
}

function decrypt(data) {
  const raw = Buffer.from(data, "hex");

  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

module.exports = { encrypt, decrypt };