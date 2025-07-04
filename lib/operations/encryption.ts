/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://github.com/jayantkageri/>

 This program is free software: you can redistribute it and/or modify
 it under the terms of the GNU Affero General Public License as
 published by the Free Software Foundation, either version 3 of the
 License, or any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU Affero General Public License for more details.

 You should have received a copy of the GNU Affero General Public License
 along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import os from "os";
import path from "path";
import fs from "fs/promises";
import { promisify } from "util";
import sodium from "libsodium-wrappers";
import { createHmac, createCipheriv, createDecipheriv } from "crypto";
import Config from "@/lib/constant";

const setImmediatePromise = promisify(setImmediate);

function secureZeroBuffer(buffer: Buffer): void {
  if (buffer && buffer.length > 0) buffer.fill(0);
}

function secureZeroUint8Array(array: Uint8Array): void {
  if (array && array.length > 0) array.fill(0);
}

function getAppDataDirectory(): string {
  const platform = process.platform;
  const homeDir = os.homedir();

  switch (platform) {
    case "win32":
      return path.join(homeDir, "AppData", "Local", "realm");
    case "darwin":
      return path.join(homeDir, "Library", "Application Support", "realm");
    case "linux":
    default:
      return path.join(homeDir, ".config", "realm");
  }
}

const APP_DATA_DIR = getAppDataDirectory();
const TEMP_DATA_DIR = path.join(os.tmpdir(), "realm");
const MASTER_KEY_PATH = path.join(APP_DATA_DIR, "master_key.bin");

async function ensureSodiumReady(): Promise<void> {
  await sodium.ready;

  if (typeof sodium.randombytes_buf !== "function")
    throw new Error("sodium.randombytes_buf is not available");
  if (typeof sodium.crypto_secretbox_easy !== "function")
    throw new Error("sodium.crypto_secretbox_easy is not available");
  if (typeof sodium.crypto_secretbox_open_easy !== "function")
    throw new Error("sodium.crypto_secretbox_open_easy is not available");
}

async function setSecureFilePermissions(filePath: string): Promise<void> {
  try {
    if (process.platform === "win32") {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const execAsync = promisify(exec);

      await execAsync(
        `icacls "${filePath}" /inheritance:r /grant:r "%USERNAME%":F`
      );
    } else await fs.chmod(filePath, 0o600);
  } catch (error: unknown) {
    throw new Error(
      `Failed to set secure file permissions: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

async function createSecureDirectory(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true, mode: 0o700 });
    if (process.platform !== "win32") await fs.chmod(dirPath, 0o700);
  }
}

async function generateMasterKey(): Promise<Buffer> {
  await ensureSodiumReady();

  try {
    const masterKey = sodium.randombytes_buf(32);
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const storageKey = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);

    const encrypted = sodium.crypto_secretbox_easy(
      masterKey,
      nonce,
      storageKey
    );

    const combined = Buffer.concat([
      Buffer.from(nonce),
      Buffer.from(storageKey),
      Buffer.from(encrypted),
    ]);

    secureZeroUint8Array(masterKey);
    secureZeroUint8Array(storageKey);

    return combined;
  } catch (error: unknown) {
    throw new Error(
      `Failed to generate master key: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

async function loadMasterKey(): Promise<Buffer> {
  await ensureSodiumReady();

  try {
    await fs.access(MASTER_KEY_PATH);
  } catch {
    throw new Error("Master key file not found");
  }

  try {
    const combined = await fs.readFile(MASTER_KEY_PATH);

    const minSize =
      sodium.crypto_secretbox_NONCEBYTES +
      sodium.crypto_secretbox_KEYBYTES +
      sodium.crypto_secretbox_MACBYTES;

    if (combined.length < minSize) {
      throw new Error(
        `Master key file too small: ${combined.length} < ${minSize} bytes`
      );
    }

    let offset = 0;
    const nonce = combined.subarray(
      offset,
      offset + sodium.crypto_secretbox_NONCEBYTES
    );
    offset += sodium.crypto_secretbox_NONCEBYTES;

    const storageKey = combined.subarray(
      offset,
      offset + sodium.crypto_secretbox_KEYBYTES
    );
    offset += sodium.crypto_secretbox_KEYBYTES;

    const encrypted = combined.subarray(offset);

    const masterKey = sodium.crypto_secretbox_open_easy(
      encrypted,
      nonce,
      storageKey
    );

    secureZeroBuffer(Buffer.from(storageKey));
    return Buffer.from(masterKey);
  } catch (error: unknown) {
    throw new Error(
      `Failed to load master key: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

async function initializeMasterKey(): Promise<Buffer> {
  try {
    return await loadMasterKey();
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("not found")) {
      await createSecureDirectory(APP_DATA_DIR);
      await createSecureDirectory(TEMP_DATA_DIR);

      const keyData = await generateMasterKey();
      await fs.writeFile(MASTER_KEY_PATH, keyData, { mode: 0o600 });
      await setSecureFilePermissions(MASTER_KEY_PATH);

      return await loadMasterKey();
    }
    throw error;
  }
}

async function hkdfAsync(
  algorithm: string,
  masterKey: Buffer,
  salt: Buffer,
  info: Buffer,
  keyLength: number
): Promise<Buffer> {
  if (!["sha256"].includes(algorithm))
    throw new Error(`Unsupported HKDF algorithm: ${algorithm}`);

  if (!masterKey || !Buffer.isBuffer(masterKey) || masterKey.length === 0)
    throw new Error("Invalid master key");

  if (!salt || !Buffer.isBuffer(salt) || salt.length === 0)
    throw new Error("Invalid salt");

  if (!info || !Buffer.isBuffer(info))
    throw new Error("Invalid info parameter");

  if (keyLength <= 0 || keyLength > 255 * 32)
    throw new Error(`Invalid key length: ${keyLength}`);

  await setImmediatePromise();
  const prk: Buffer = createHmac(algorithm, salt).update(masterKey).digest();

  let t: Buffer = Buffer.alloc(0);
  let okm: Buffer = Buffer.alloc(0);
  const hashLength = 32;
  const iterations = Math.ceil(keyLength / hashLength);

  for (let i = 0; i < iterations; i++) {
    await setImmediatePromise();

    const hmac = createHmac(algorithm, prk);
    hmac.update(t);
    if (info.length > 0) hmac.update(info);
    hmac.update(Buffer.from([i + 1]));
    t = hmac.digest();

    okm = Buffer.concat([okm, t]);
  }

  return okm.slice(0, keyLength);
}

async function encryptData(data: string): Promise<string> {
  if (!data || typeof data !== "string")
    throw new Error("Invalid input data for encryption");

  let masterKey: Buffer | null = null;
  let derivedKey: Buffer | null = null;
  let iv: Buffer | null = null;

  try {
    await ensureSodiumReady();
    masterKey = await initializeMasterKey();

    iv = Buffer.from(sodium.randombytes_buf(Config.CIPHER_IV_SIZE));
    const salt = Buffer.from(sodium.randombytes_buf(32));

    derivedKey = await hkdfAsync(
      "sha256",
      masterKey,
      salt,
      Buffer.alloc(0),
      Config.CIPHER_KEY_SIZE
    );

    const cipher = createCipheriv(Config.CIPHER_ALGORITHM, derivedKey, iv);

    let encrypted = cipher.update(data, "utf8", Config.CIPHER_ENCODING);
    encrypted += cipher.final();

    const combined = Buffer.concat([
      salt,
      iv,
      Buffer.from(encrypted, Config.CIPHER_ENCODING),
    ]);

    return combined.toString(Config.CIPHER_ENCODING);
  } catch (error: unknown) {
    throw new Error(
      `Encryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    if (masterKey) secureZeroBuffer(masterKey);
    if (derivedKey) secureZeroBuffer(derivedKey);
    if (iv) secureZeroBuffer(iv);
  }
}

async function decryptData(encryptedData: string): Promise<string> {
  if (!encryptedData || typeof encryptedData !== "string")
    throw new Error("Invalid encrypted data for decryption");

  let masterKey: Buffer | null = null;
  let derivedKey: Buffer | null = null;

  try {
    await ensureSodiumReady();
    masterKey = await initializeMasterKey();

    // Validate hex encoding
    if (!/^[0-9a-fA-F]+$/.test(encryptedData)) {
      throw new Error("Invalid hex encoded data");
    }

    const combined = Buffer.from(encryptedData, Config.CIPHER_ENCODING);

    const minSize = 32 + Config.CIPHER_IV_SIZE;
    if (combined.length < minSize)
      throw new Error(
        `Invalid encrypted data format: ${combined.length} bytes too small`
      );

    const salt = combined.subarray(0, 32);
    const iv = combined.subarray(32, 32 + Config.CIPHER_IV_SIZE);
    const encrypted = combined.subarray(32 + Config.CIPHER_IV_SIZE);

    derivedKey = await hkdfAsync(
      "sha256",
      masterKey,
      salt,
      Buffer.alloc(0),
      Config.CIPHER_KEY_SIZE
    );

    const decipher = createDecipheriv(Config.CIPHER_ALGORITHM, derivedKey, iv);

    let decrypted = decipher.update(encrypted, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error: unknown) {
    throw new Error(
      `Decryption failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  } finally {
    if (masterKey) secureZeroBuffer(masterKey);
    if (derivedKey) secureZeroBuffer(derivedKey);
  }
}

async function cleanup(): Promise<void> {
  try {
    await ensureSodiumReady();
    await fs.access(TEMP_DATA_DIR);
    const tempFiles = await fs.readdir(TEMP_DATA_DIR);

    await Promise.all(
      tempFiles.map(async (file) => {
        const filePath = path.join(TEMP_DATA_DIR, file);
        try {
          const stats = await fs.stat(filePath);
          const randomData = Buffer.from(sodium.randombytes_buf(stats.size));
          await fs.writeFile(filePath, randomData);
          await fs.unlink(filePath);
        } catch {}
      })
    );
  } catch {}
}

export { encryptData, decryptData, cleanup };
