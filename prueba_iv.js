const crypto = require("crypto");

const KEY = crypto.randomBytes(32);

// ❌ MISMO IV (INSEGURO)
const iv = crypto.randomBytes(12);

const c1 = crypto.createCipheriv("aes-256-gcm", KEY, iv);
let dato1 = c1.update("AAA", "utf8", "hex");
dato1 += c1.final("hex");

const c2 = crypto.createCipheriv("aes-256-gcm", KEY, iv);
let dato2 = c2.update("BBB", "utf8", "hex");
dato2 += c2.final("hex");

console.log("❌ CIFRADO INSEGURO");
console.log("Mismo IV reutilizado");
console.log("Dato 1:", dato1);
console.log("Dato 2:", dato2);

// ✅ IV DIFERENTE (SEGURO)
const iv1 = crypto.randomBytes(12);
const iv2 = crypto.randomBytes(12);

const s1 = crypto.createCipheriv("aes-256-gcm", KEY, iv1);
let seguro1 = s1.update("AAA", "utf8", "hex");
seguro1 += s1.final("hex");

const s2 = crypto.createCipheriv("aes-256-gcm", KEY, iv2);
let seguro2 = s2.update("BBB", "utf8", "hex");
seguro2 += s2.final("hex");

console.log("\n✅ CIFRADO SEGURO");
console.log("IV diferentes");
console.log("Dato 1:", seguro1);
console.log("Dato 2:", seguro2);