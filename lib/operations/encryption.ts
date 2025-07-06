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
import {
  createHmac,
  createCipheriv,
  createDecipheriv,
  timingSafeEqual,
} from "crypto";
import { lock, unlock } from "proper-lockfile";
import Config from "@/lib/constant";

const CIPHER_ALGORITHM: string = Config.CIPHER_ALGORITHM;
const CIPHER_KEY_SIZE: number = Config.CIPHER_KEY_SIZE;
const CIPHER_IV_SIZE: number = Config.CIPHER_IV_SIZE;
const CIPHER_ENCODING: BufferEncoding = Config.CIPHER_ENCODING;
const SALT_LENGTH: number = 32;
const MASTER_KEY_LENGTH: number = 32;

class CryptoError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "CryptoError";
    if (cause) (this as Error & { cause?: unknown }).cause = cause;
  }
}

class FileSystemError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "FileSystemError";
    if (cause) (this as Error & { cause?: unknown }).cause = cause;
  }
}

class InputValidator {
  static validateFilePath(filePath: string): string {
    const normalized = path.resolve(filePath);
    if (normalized.includes("..") || normalized.includes("\0"))
      throw new FileSystemError("Invalid file path detected");
    return normalized;
  }
}

class FileSystem {
  private readonly appDataDir: string;
  private readonly tempDataDir: string;
  private readonly masterKeyPath: string;

  constructor() {
    this.appDataDir = this.getAppDataDirectory();
    this.tempDataDir = path.join(os.tmpdir(), "realm");
    this.masterKeyPath = path.join(this.appDataDir, "master_key.bin");
  }

  private getAppDataDirectory(): string {
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

  async withFileLock<T>(
    filePath: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const normalizedPath = InputValidator.validateFilePath(filePath);
    let releaseLock: (() => Promise<void>) | null = null;
    let lockAcquired = false;
    try {
      await this.createSecureDirectory(path.dirname(normalizedPath));
      const lockOptions = {
        retries: { retries: 5, factor: 2, minTimeout: 100, maxTimeout: 1000 },
        stale: 15000,
        realpath: false,
        onCompromised: (err: Error) => {
          throw new FileSystemError("Lock was compromised", err);
        },
      };
      releaseLock = async () => {
        if (lockAcquired) {
          try {
            await unlock(normalizedPath, lockOptions);
            lockAcquired = false;
          } catch {}
        }
      };
      await lock(normalizedPath, lockOptions);
      lockAcquired = true;
      return await operation();
    } catch (error) {
      throw new FileSystemError(
        "File operation failed",
        error instanceof Error ? error : undefined
      );
    } finally {
      if (releaseLock) await releaseLock();
    }
  }

  async setSecureFilePermissions(filePath: string): Promise<void> {
    const validatedPath = InputValidator.validateFilePath(filePath);
    try {
      if (process.platform === "win32") {
        const { exec } = await import("child_process");
        const execAsync = promisify(exec);
        await execAsync(
          `icacls "${validatedPath}" /inheritance:d /grant:r "%USERNAME%":(F) /remove:g "Users" /remove:g "Authenticated Users" /remove:g "Everyone" /remove:g "BUILTIN\\Users" /inheritance:r`
        );
        await execAsync(`attrib +H +S "${validatedPath}"`);
        const { stdout } = await execAsync(`icacls "${validatedPath}"`);
        if (!stdout.includes("%USERNAME%"))
          throw new Error("Failed to verify Windows permissions");
      } else {
        await fs.chmod(validatedPath, 0o600);
        if (process.platform === "linux") {
          try {
            const { exec } = await import("child_process");
            const execAsync = promisify(exec);
            await execAsync(`chattr +i "${validatedPath}"`).catch(() => {});
          } catch {}
        }
      }
    } catch (error) {
      throw new FileSystemError("Security configuration failed", error);
    }
  }

  async createSecureDirectory(dirPath: string): Promise<void> {
    const validatedPath = InputValidator.validateFilePath(dirPath);
    try {
      await fs.access(validatedPath);
    } catch {
      try {
        await fs.mkdir(validatedPath, { recursive: true, mode: 0o700 });
        if (process.platform !== "win32") await fs.chmod(validatedPath, 0o700);
        else {
          const { exec } = await import("child_process");
          const execAsync = promisify(exec);
          await execAsync(
            `icacls "${validatedPath}" /inheritance:d /grant:r "%USERNAME%":(OI)(CI)(F) /remove:g "Users" /remove:g "Authenticated Users" /remove:g "Everyone" /remove:g "BUILTIN\\Users" /inheritance:r`
          );
        }
      } catch (error) {
        throw new FileSystemError("Directory creation failed", error);
      }
    }
  }

  async cleanup(): Promise<void> {
    try {
      await CryptoManager.ensureSodiumReady();
      await fs.access(this.tempDataDir);
      const tempFiles = await fs.readdir(this.tempDataDir);
      await Promise.allSettled(
        tempFiles.map(async (file: string) => {
          const filePath = path.join(this.tempDataDir, file);
          return this.withFileLock(filePath, async () => {
            try {
              const stats = await fs.stat(filePath);
              for (let i = 0; i < 3; i++)
                await fs.writeFile(
                  filePath,
                  Buffer.from(sodium.randombytes_buf(stats.size))
                );
              await fs.unlink(filePath);
            } catch {}
          });
        })
      );
    } catch {}
  }

  async initializeDirectories(): Promise<void> {
    await this.createSecureDirectory(this.appDataDir);
    await this.createSecureDirectory(this.tempDataDir);
  }

  get masterKeyFilePath(): string {
    return this.masterKeyPath;
  }

  get applicationDataDirectory(): string {
    return this.appDataDir;
  }

  get temporaryDataDirectory(): string {
    return this.tempDataDir;
  }
}

class MemoryUtils {
  static secureZeroBuffer(buffer: Buffer): void {
    if (buffer && buffer.length > 0) buffer.fill(0);
  }
  static secureZeroUint8Array(array: Uint8Array): void {
    if (array && array.length > 0) array.fill(0);
  }
  static constantTimeEquals(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) return false;
    try {
      return timingSafeEqual(a, b);
    } catch {
      let result = 0;
      for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i];
      return result === 0;
    }
  }
  static createContext(module: string, algorithm: string): Buffer {
    return Buffer.concat([
      Buffer.from(module, "utf8"),
      Buffer.from(algorithm, "utf8"),
      Buffer.from([CIPHER_KEY_SIZE]),
    ]);
  }
}

class SecureMemoryManager {
  static allocatedBuffers = new Set<Uint8Array>();
  static isInitialized = false;
  static async initialize(): Promise<void> {
    if (SecureMemoryManager.isInitialized) return;
    await sodium.ready;
    SecureMemoryManager.isInitialized = true;
  }
  static allocate(size: number): Uint8Array {
    if (!SecureMemoryManager.isInitialized)
      throw new CryptoError("Secure memory not initialized");
    if (size <= 0 || size > 1024 * 1024)
      throw new CryptoError("Invalid secure memory allocation size");
    const buffer: Uint8Array = new Uint8Array(size);
    SecureMemoryManager.allocatedBuffers.add(buffer);
    return buffer;
  }
  static free(buffer: Uint8Array): void {
    if (!buffer || buffer.length === 0) return;
    SecureMemoryManager.allocatedBuffers.delete(buffer);
    MemoryUtils.secureZeroUint8Array(buffer);
  }
  static emergencyCleanup() {
    for (const buffer of SecureMemoryManager.allocatedBuffers) {
      try {
        SecureMemoryManager.free(buffer);
      } catch {}
    }
    SecureMemoryManager.allocatedBuffers.clear();
  }
}

async function hkdfAsync(
  algorithm: string,
  masterKey: Buffer,
  salt: Buffer,
  info: Buffer,
  keyLength: number
): Promise<Buffer> {
  if (!masterKey || !Buffer.isBuffer(masterKey) || masterKey.length === 0)
    throw new CryptoError("Invalid master key");
  if (!salt || !Buffer.isBuffer(salt) || salt.length === 0)
    throw new CryptoError("Invalid salt");
  if (!info || !Buffer.isBuffer(info))
    throw new CryptoError("Invalid info parameter");

  const hashLength =
    algorithm === "sha256" ? 32 : algorithm === "sha384" ? 48 : 64;
  const maxKeyLength = 255 * hashLength;

  if (keyLength <= 0 || keyLength > maxKeyLength)
    throw new CryptoError(
      `Invalid key length: ${keyLength}. Max for ${algorithm}: ${maxKeyLength}`
    );

  const prk: Buffer = createHmac(algorithm, salt).update(masterKey).digest();
  let t: Buffer = Buffer.alloc(0);
  let okm: Buffer = Buffer.alloc(0);
  const iterations = Math.ceil(keyLength / hashLength);

  for (let i = 0; i < iterations; i++) {
    const hmac = createHmac(algorithm, prk);
    hmac.update(t);
    if (info.length > 0) hmac.update(info);
    hmac.update(Buffer.from([i + 1]));
    t = hmac.digest();
    okm = Buffer.concat([okm, t]);
  }

  MemoryUtils.secureZeroBuffer(prk);
  MemoryUtils.secureZeroBuffer(t);

  return okm.subarray(0, keyLength);
}

class CryptoManager {
  static isInitialized = false;
  static keyCache: Uint8Array | null = null;
  static keyCacheExpiry: number = 0;
  static KEY_CACHE_TTL = 60000;
  private fileSystem: FileSystem;

  constructor() {
    this.fileSystem = new FileSystem();
  }

  static async ensureSodiumReady(): Promise<void> {
    await sodium.ready;
    if (!CryptoManager.isInitialized) {
      await SecureMemoryManager.initialize();
      CryptoManager.isInitialized = true;
    }
    const requiredFunctions = [
      "randombytes_buf",
      "crypto_secretbox_easy",
      "crypto_secretbox_open_easy",
    ];
    for (const func of requiredFunctions) {
      if (typeof (sodium as Record<string, unknown>)[func] !== "function") {
        throw new CryptoError(
          "Required sodium function not available: " + func
        );
      }
    }
  }

  private async generateMasterKey(): Promise<Buffer> {
    await CryptoManager.ensureSodiumReady();
    const masterKey = SecureMemoryManager.allocate(MASTER_KEY_LENGTH);
    const nonce = SecureMemoryManager.allocate(
      sodium.crypto_secretbox_NONCEBYTES
    );
    const storageKey = SecureMemoryManager.allocate(
      sodium.crypto_secretbox_KEYBYTES
    );
    try {
      masterKey.set(sodium.randombytes_buf(MASTER_KEY_LENGTH));
      nonce.set(sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES));
      storageKey.set(sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES));
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
      SecureMemoryManager.free(masterKey);
      SecureMemoryManager.free(storageKey);
      SecureMemoryManager.free(nonce);
      return combined;
    } catch {
      SecureMemoryManager.free(masterKey);
      SecureMemoryManager.free(storageKey);
      SecureMemoryManager.free(nonce);
      throw new CryptoError("Key generation failed");
    }
  }

  private async loadMasterKey(): Promise<Buffer> {
    await CryptoManager.ensureSodiumReady();
    const masterKeyPath = this.fileSystem.masterKeyFilePath;
    return this.fileSystem.withFileLock(masterKeyPath, async () => {
      let combined: Buffer | null = null;
      const masterKey = SecureMemoryManager.allocate(MASTER_KEY_LENGTH);
      try {
        await fs.access(masterKeyPath);
      } catch {
        throw new CryptoError("Key file not found");
      }
      try {
        combined = await fs.readFile(masterKeyPath);
        const minSize =
          sodium.crypto_secretbox_NONCEBYTES +
          sodium.crypto_secretbox_KEYBYTES +
          sodium.crypto_secretbox_MACBYTES;
        if (combined.length < minSize)
          throw new CryptoError("Invalid key file format");
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
        const decryptedKey = sodium.crypto_secretbox_open_easy(
          encrypted,
          nonce,
          storageKey
        );
        masterKey.set(decryptedKey);
        MemoryUtils.secureZeroUint8Array(decryptedKey);
        const result = Buffer.from(masterKey);
        SecureMemoryManager.free(masterKey);
        return result;
      } catch {
        SecureMemoryManager.free(masterKey);
        throw new CryptoError("Key loading failed");
      } finally {
        if (combined) MemoryUtils.secureZeroBuffer(combined);
      }
    });
  }

  async initializeMasterKey(): Promise<Buffer> {
    if (CryptoManager.keyCache && Date.now() < CryptoManager.keyCacheExpiry)
      return Buffer.from(CryptoManager.keyCache);

    if (CryptoManager.keyCache) {
      SecureMemoryManager.free(CryptoManager.keyCache);
      CryptoManager.keyCache = null;
    }
    try {
      const masterKey = await this.loadMasterKey();
      CryptoManager.keyCache = SecureMemoryManager.allocate(masterKey.length);
      CryptoManager.keyCache.set(masterKey);
      CryptoManager.keyCacheExpiry = Date.now() + CryptoManager.KEY_CACHE_TTL;
      const result = Buffer.from(masterKey);
      MemoryUtils.secureZeroBuffer(masterKey);
      return result;
    } catch (error) {
      if (error instanceof CryptoError && error.message.includes("not found")) {
        const masterKeyPath = this.fileSystem.masterKeyFilePath;
        return this.fileSystem.withFileLock(masterKeyPath, async () => {
          try {
            return await this.loadMasterKey();
          } catch {
            await this.fileSystem.initializeDirectories();
            const keyData = await this.generateMasterKey();
            await fs.writeFile(masterKeyPath, keyData, { mode: 0o600 });
            await this.fileSystem.setSecureFilePermissions(masterKeyPath);
            MemoryUtils.secureZeroBuffer(keyData);
            return await this.loadMasterKey();
          }
        });
      }
      throw error;
    }
  }

  async hkdfKey(
    masterKey: Buffer,
    salt: Buffer,
    info: Buffer,
    keyLength: number
  ): Promise<Buffer> {
    return await hkdfAsync(
      "sha256",
      masterKey,
      salt,
      Buffer.alloc(0),
      keyLength
    );
  }

  async encryptData(data: string): Promise<string> {
    let masterKey: Buffer | null = null;
    let derivedKey: Buffer | null = null;
    let iv: Buffer | null = null;
    let salt: Buffer | null = null;
    try {
      await CryptoManager.ensureSodiumReady();
      masterKey = await this.initializeMasterKey();
      iv = Buffer.from(sodium.randombytes_buf(CIPHER_IV_SIZE));
      salt = Buffer.from(sodium.randombytes_buf(SALT_LENGTH));
      derivedKey = await this.hkdfKey(
        masterKey,
        salt,
        Buffer.alloc(0),
        CIPHER_KEY_SIZE
      );
      const cipher = createCipheriv(CIPHER_ALGORITHM, derivedKey, iv);
      let encrypted = cipher.update(data, "utf8", CIPHER_ENCODING);
      encrypted += cipher.final(CIPHER_ENCODING);
      const combined = Buffer.concat([
        salt,
        iv,
        Buffer.from(encrypted, CIPHER_ENCODING),
      ]);
      MemoryUtils.secureZeroBuffer(derivedKey);
      return combined.toString(CIPHER_ENCODING);
    } catch {
      throw new CryptoError("Encryption operation failed");
    } finally {
      if (masterKey) MemoryUtils.secureZeroBuffer(masterKey);
      if (derivedKey) MemoryUtils.secureZeroBuffer(derivedKey);
      if (iv) MemoryUtils.secureZeroBuffer(iv);
      if (salt) MemoryUtils.secureZeroBuffer(salt);
    }
  }

  async decryptData(encryptedData: string): Promise<string> {
    if (!encryptedData || typeof encryptedData !== "string")
      throw new CryptoError("Invalid encrypted data");
    let masterKey: Buffer | null = null;
    let derivedKey: Buffer | null = null;
    let combined: Buffer | null = null;
    let salt: Buffer | null = null;
    let iv: Buffer | null = null;
    try {
      await CryptoManager.ensureSodiumReady();
      masterKey = await this.initializeMasterKey();
      combined = Buffer.from(encryptedData.trim(), CIPHER_ENCODING);
      const minSize = SALT_LENGTH + CIPHER_IV_SIZE;
      if (combined.length < minSize)
        throw new CryptoError("Invalid data format");
      salt = combined.subarray(0, SALT_LENGTH);
      iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + CIPHER_IV_SIZE);
      const encrypted = combined.subarray(SALT_LENGTH + CIPHER_IV_SIZE);
      derivedKey = await this.hkdfKey(
        masterKey,
        salt,
        Buffer.alloc(0),
        CIPHER_KEY_SIZE
      );
      const decipher = createDecipheriv(CIPHER_ALGORITHM, derivedKey, iv);
      let decrypted = decipher.update(encrypted, undefined, "utf8");
      decrypted += decipher.final("utf8");
      MemoryUtils.secureZeroBuffer(derivedKey);
      return decrypted;
    } catch {
      throw new CryptoError("Decryption operation failed");
    } finally {
      if (masterKey) MemoryUtils.secureZeroBuffer(masterKey);
      if (derivedKey) MemoryUtils.secureZeroBuffer(derivedKey);
      if (combined) MemoryUtils.secureZeroBuffer(combined);
      if (salt) MemoryUtils.secureZeroBuffer(salt);
      if (iv) MemoryUtils.secureZeroBuffer(iv);
    }
  }

  async cleanup(): Promise<void> {
    await this.fileSystem.cleanup();
  }

  static shutdown(): void {
    if (CryptoManager.keyCache) {
      SecureMemoryManager.free(CryptoManager.keyCache);
      CryptoManager.keyCache = null;
    }
    SecureMemoryManager.emergencyCleanup();
  }
}

process.on("exit", () => {
  CryptoManager.shutdown();
});
process.on("SIGINT", () => {
  CryptoManager.shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  CryptoManager.shutdown();
  process.exit(0);
});

export {
  CryptoManager,
  FileSystem,
  MemoryUtils,
  InputValidator,
  CryptoError,
  FileSystemError,
};
