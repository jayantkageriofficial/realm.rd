/* eslint-disable */
// The following is a secure encryption module for Node.js,
// but it is not compatible with Next.js due to its use of Node.js-specific APIs.

/*
 realm.rd, Scribble the plans, spill the thoughts.
 Copyright (C) 2025 Jayant Hegde Kageri <https://jayantkageri.in/>

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
import { createCipheriv, createDecipheriv, timingSafeEqual } from "crypto";
import { lock, unlock } from "proper-lockfile";
import Config from "@/lib/constant";

const ENCRYPTION_MODULE: string = "realm-encryption-v1";
const CIPHER_ALGORITHM: string = Config.CIPHER_ALGORITHM;
const CIPHER_KEY_SIZE: number = Config.CIPHER_KEY_SIZE;
const CIPHER_IV_SIZE: number = Config.CIPHER_IV_SIZE;
const CIPHER_ENCODING: BufferEncoding = Config.CIPHER_ENCODING;
const SALT_LENGTH: number = 32;
const MASTER_KEY_LENGTH: number = (sodium.crypto_kdf_KEYBYTES as number) || 32;

class CryptoError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "CryptoError";
    if (cause) (this as any).cause = cause;
  }
}

class FileSystemError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "FileSystemError";
    if (cause) (this as any).cause = cause;
  }
}

class InputValidator {
  static validateFilePath(filePath: string): string {
    if (!filePath || typeof filePath !== "string") {
      throw new FileSystemError("Invalid file path");
    }
    const normalized = path.resolve(filePath);
    if (normalized.includes("..") || normalized.includes("\0")) {
      throw new FileSystemError("Invalid file path detected");
    }
    return normalized;
  }

  static validateEncryptionData(data: string): void {
    if (!data || typeof data !== "string") {
      throw new CryptoError("Invalid encryption input");
    }
    if (data.length > 1024 * 1024) {
      throw new CryptoError("Data too large for encryption");
    }
  }
}

class FileSystem {
  private static fileOperationLocks = new Map<string, Promise<any>>();
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
        if (!stdout.includes("%USERNAME%")) {
          throw new Error("Failed to verify Windows permissions");
        }
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
        if (process.platform !== "win32") {
          await fs.chmod(validatedPath, 0o700);
        } else {
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
              for (let i = 0; i < 3; i++) {
                const randomData = Buffer.from(
                  sodium.randombytes_buf(stats.size)
                );
                await fs.writeFile(filePath, randomData);
              }
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
  static createContext(
    module: string,
    algorithm: string,
    purpose: string = "encrypt"
  ): Buffer {
    const contextData = `${module}:${algorithm}:${purpose}:${Date.now()}:v2`;
    if (typeof sodium.crypto_generichash === "function") {
      return Buffer.from(
        sodium.crypto_generichash(8, Buffer.from(contextData, "utf8"))
      );
    }
    return Buffer.from(contextData.slice(0, 8), "utf8");
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
    let buffer: Uint8Array;
    if ((sodium as any).sodium_malloc)
      buffer = (sodium as any).sodium_malloc(size);
    else buffer = new Uint8Array(size);
    SecureMemoryManager.allocatedBuffers.add(buffer);
    return buffer;
  }
  static mlock(buffer: Uint8Array): void {
    if ((sodium as any).sodium_mlock) {
      (sodium as any).sodium_mlock(buffer);
    }
  }
  static munlock(buffer: Uint8Array): void {
    if ((sodium as any).sodium_munlock) {
      (sodium as any).sodium_munlock(buffer);
    }
  }
  static free(buffer: Uint8Array): void {
    if (!buffer || buffer.length === 0) return;
    SecureMemoryManager.allocatedBuffers.delete(buffer);
    this.munlock(buffer);
    if ((sodium as any).sodium_free) (sodium as any).sodium_free(buffer);
    else MemoryUtils.secureZeroUint8Array(buffer);
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

class CryptoManager {
  static MAX_SUBKEY_ID: number = 2 ** 32 - 1;
  static isInitialized = false;
  static keyCache: Uint8Array | null = null;
  static keyCacheExpiry: number = 0;
  static KEY_CACHE_TTL = 60000;
  private fileSystem: FileSystem;

  constructor() {
    this.fileSystem = new FileSystem();
  }

  static async ensureSodiumReady(): Promise<void> {
    if (!CryptoManager.isInitialized) {
      await SecureMemoryManager.initialize();
      CryptoManager.isInitialized = true;
    }
    await sodium.ready;
    const requiredFunctions = [
      "randombytes_buf",
      "crypto_secretbox_easy",
      "crypto_secretbox_open_easy",
      "crypto_pwhash",
      "crypto_generichash",
    ];
    for (const func of requiredFunctions) {
      if (!(sodium as any)[func])
        throw new CryptoError("Required sodium function not available");
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
    } catch (error) {
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
      } catch (error) {
        SecureMemoryManager.free(masterKey);
        throw new CryptoError("Key loading failed");
      } finally {
        if (combined) MemoryUtils.secureZeroBuffer(combined);
      }
    });
  }

  async initializeMasterKey(): Promise<Buffer> {
    if (CryptoManager.keyCache && Date.now() < CryptoManager.keyCacheExpiry) {
      return Buffer.from(CryptoManager.keyCache);
    }
    // On cache expiry/removal, securely free and munlock
    if (CryptoManager.keyCache) {
      SecureMemoryManager.free(CryptoManager.keyCache);
      CryptoManager.keyCache = null;
    }
    try {
      const masterKey = await this.loadMasterKey();
      CryptoManager.keyCache = SecureMemoryManager.allocate(masterKey.length);
      CryptoManager.keyCache.set(masterKey);
      CryptoManager.keyCacheExpiry = Date.now() + CryptoManager.KEY_CACHE_TTL;
      // Secure the cached key in RAM
      SecureMemoryManager.mlock(CryptoManager.keyCache);
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

  async kdfAsync(
    masterKey: Buffer,
    salt: Buffer,
    info: Buffer,
    keyLength: number,
    subkeyId: number = 1
  ): Promise<Buffer> {
    await CryptoManager.ensureSodiumReady();
    if (!masterKey || masterKey.length !== MASTER_KEY_LENGTH)
      throw new CryptoError("Invalid master key");
    if (!salt || salt.length !== SALT_LENGTH)
      throw new CryptoError("Invalid salt length");
    if (!info || info.length === 0)
      throw new CryptoError("Invalid context info");
    if (
      !Number.isInteger(subkeyId) ||
      subkeyId < 1 ||
      subkeyId > CryptoManager.MAX_SUBKEY_ID
    )
      throw new CryptoError("Invalid subkey ID");
    let derivedKey: Uint8Array | undefined;
    try {
      // Derive with pwhash (uses salt), then use KDF for context
      const primaryKey = sodium.crypto_pwhash(
        keyLength,
        masterKey,
        salt,
        sodium.crypto_pwhash_OPSLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_MEMLIMIT_INTERACTIVE,
        sodium.crypto_pwhash_ALG_DEFAULT
      );
      derivedKey = sodium.crypto_kdf_derive_from_key(
        keyLength,
        subkeyId,
        info.length >= 8
          ? info.subarray(0, 8).toString("binary")
          : "DefaultCtx",
        primaryKey
      );
      MemoryUtils.secureZeroUint8Array(primaryKey);
      return Buffer.from(derivedKey);
    } catch (error) {
      throw new CryptoError("Key derivation failed");
    } finally {
      if (derivedKey) MemoryUtils.secureZeroUint8Array(derivedKey);
    }
  }

  async encryptData(data: string, subkeyId: number = 1): Promise<string> {
    InputValidator.validateEncryptionData(data);
    let masterKey: Buffer | null = null;
    let derivedKey: Buffer | null = null;
    let iv: Buffer | null = null;
    let salt: Buffer | null = null;
    try {
      await CryptoManager.ensureSodiumReady();
      masterKey = await this.initializeMasterKey();
      iv = Buffer.from(sodium.randombytes_buf(CIPHER_IV_SIZE));
      salt = Buffer.from(sodium.randombytes_buf(SALT_LENGTH));
      const contextInfo = MemoryUtils.createContext(
        ENCRYPTION_MODULE,
        CIPHER_ALGORITHM,
        "encrypt"
      );
      derivedKey = await this.kdfAsync(
        masterKey,
        salt,
        contextInfo,
        CIPHER_KEY_SIZE,
        subkeyId
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
    } catch (error) {
      throw new CryptoError("Encryption operation failed");
    } finally {
      if (masterKey) MemoryUtils.secureZeroBuffer(masterKey);
      if (derivedKey) MemoryUtils.secureZeroBuffer(derivedKey);
      if (iv) MemoryUtils.secureZeroBuffer(iv);
      if (salt) MemoryUtils.secureZeroBuffer(salt);
    }
  }

  async decryptData(
    encryptedData: string,
    subkeyId: number = 1
  ): Promise<string> {
    if (!encryptedData || typeof encryptedData !== "string")
      throw new CryptoError("Invalid encrypted data");
    let masterKey: Buffer | null = null;
    let derivedKey: Buffer | null = null;
    let combined: Buffer | null = null;
    try {
      await CryptoManager.ensureSodiumReady();
      masterKey = await this.initializeMasterKey();
      combined = Buffer.from(encryptedData.trim(), CIPHER_ENCODING);
      const minSize = SALT_LENGTH + CIPHER_IV_SIZE;
      if (combined.length < minSize)
        throw new CryptoError("Invalid data format");
      const salt = combined.subarray(0, SALT_LENGTH);
      const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + CIPHER_IV_SIZE);
      const encrypted = combined.subarray(SALT_LENGTH + CIPHER_IV_SIZE);
      const contextInfo = MemoryUtils.createContext(
        ENCRYPTION_MODULE,
        CIPHER_ALGORITHM,
        "encrypt"
      );
      derivedKey = await this.kdfAsync(
        masterKey,
        salt,
        contextInfo,
        CIPHER_KEY_SIZE,
        subkeyId
      );
      const decipher = createDecipheriv(CIPHER_ALGORITHM, derivedKey, iv);
      let decrypted = decipher.update(encrypted, undefined, "utf8");
      decrypted += decipher.final("utf8");
      MemoryUtils.secureZeroBuffer(derivedKey);
      return decrypted;
    } catch (error) {
      throw new CryptoError("Decryption operation failed");
    } finally {
      if (masterKey) MemoryUtils.secureZeroBuffer(masterKey);
      if (derivedKey) MemoryUtils.secureZeroBuffer(derivedKey);
      if (combined) MemoryUtils.secureZeroBuffer(combined);
    }
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

let sigLoad = false;
if (!sigLoad) {
  ["SIGTERM", "SIGINT"].forEach((signal) => {
    process.once(signal as NodeJS.Signals, async () => {
      CryptoManager.shutdown();
      process.exit(0);
    });
  });
  sigLoad = true;
}

export {
  FileSystem,
  CryptoManager,
  MemoryUtils,
  CryptoError,
  FileSystemError,
  SecureMemoryManager,
};
