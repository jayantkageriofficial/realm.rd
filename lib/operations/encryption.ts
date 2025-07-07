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
  randomBytes,
} from "crypto";
import { lock, unlock } from "proper-lockfile";
import Config from "@/lib/constant";

const CIPHER_ALGORITHM: string = Config.CIPHER_ALGORITHM;
const CIPHER_KEY_SIZE: number = Config.CIPHER_KEY_SIZE;
const CIPHER_IV_SIZE: number = Config.CIPHER_IV_SIZE;
const CIPHER_ENCODING: BufferEncoding = Config.CIPHER_ENCODING;
const SALT_LENGTH: number = 32;
const MASTER_KEY_LENGTH: number = 32;
const MAX_SECURE_MEMORY_POOL_SIZE: number = 10 * 1024 * 1024; // 10MB limit
const KEY_ROTATION_INTERVAL: number = 24 * 60 * 60 * 1000; // 24 hours
const AUDIT_LOG_MAX_SIZE: number = 100 * 1024 * 1024; // 100MB

class AsyncMutex {
  private locked = false;
  private waitQueue: Array<() => void> = [];

  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    while (this.locked) {
      await new Promise<void>((resolve) => this.waitQueue.push(resolve));
    }

    this.locked = true;
    try {
      return await fn();
    } finally {
      this.locked = false;
      const next = this.waitQueue.shift();
      if (next) next();
    }
  }
}

class CryptoError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;
  public readonly context: string;

  constructor(
    message: string,
    code: string = "CRYPTO_ERROR",
    context: string = "",
    cause?: unknown
  ) {
    super(message);
    this.name = "CryptoError";
    this.code = code;
    this.timestamp = new Date();
    this.context = context;
    if (cause) (this as Error & { cause?: unknown }).cause = cause;
  }
}

class FileSystemError extends Error {
  public readonly code: string;
  public readonly timestamp: Date;

  constructor(message: string, code: string = "FS_ERROR", cause?: unknown) {
    super(message);
    this.name = "FileSystemError";
    this.code = code;
    this.timestamp = new Date();
    if (cause) (this as Error & { cause?: unknown }).cause = cause;
  }
}

class SecurityAuditLogger {
  private static instance: SecurityAuditLogger | null = null;
  private logPath: string;
  private isEnabled: boolean = true;

  private constructor() {
    this.logPath = path.join(os.tmpdir(), "realm-security-audit.log");
  }

  static getInstance(): SecurityAuditLogger {
    if (!SecurityAuditLogger.instance)
      SecurityAuditLogger.instance = new SecurityAuditLogger();
    return SecurityAuditLogger.instance;
  }

  async logSecurityEvent(
    event: string,
    severity: "INFO" | "WARN" | "ERROR" | "CRITICAL",
    details: Record<string, unknown> = {}
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        severity,
        user: "unknown",
        pid: process.pid,
        details: this.sanitizeLogData(details),
      };

      const logLine = JSON.stringify(logEntry) + "\n";

      try {
        const stats = await fs.stat(this.logPath);
        if (stats.size > AUDIT_LOG_MAX_SIZE)
          await fs.rename(this.logPath, `${this.logPath}.old`);
      } catch {}

      await fs.appendFile(this.logPath, logLine, { mode: 0o600 });
    } catch (error) {
      console.error("Security audit logging failed:", error);
    }
  }

  private sanitizeLogData(
    data: Record<string, unknown>
  ): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (
        key.toLowerCase().includes("key") ||
        key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("secret")
      )
        sanitized[key] = "[REDACTED]";
      else if (typeof value === "string" && value.length > 1000)
        sanitized[key] = value.substring(0, 1000) + "...[TRUNCATED]";
      else sanitized[key] = value;
    }
    return sanitized;
  }

  disable(): void {
    this.isEnabled = false;
  }
}

class InputValidator {
  private static readonly DANGEROUS_PATTERNS = [
    /\0/g,
    /\.\./g,
    /[<>"|*?]/g,
    /[\x00-\x1f]/g,
  ];

  private static readonly MAX_PATH_LENGTH = 4096;
  private static readonly MAX_DATA_SIZE = 100 * 1024 * 1024; // 100MB

  static validateFilePath(filePath: string): string {
    if (filePath.length > InputValidator.MAX_PATH_LENGTH)
      throw new FileSystemError("File path too long", "PATH_TOO_LONG");

    for (const pattern of InputValidator.DANGEROUS_PATTERNS) {
      if (pattern.test(filePath)) {
        SecurityAuditLogger.getInstance().logSecurityEvent(
          "SUSPICIOUS_PATH_DETECTED",
          "WARN",
          { path: filePath, pattern: pattern.source }
        );
        throw new FileSystemError(
          "Dangerous pattern detected in file path",
          "DANGEROUS_PATH"
        );
      }
    }

    try {
      const normalized = path.resolve(filePath);
      const homeDir = os.homedir();
      const tempDir = os.tmpdir();

      if (!normalized.startsWith(homeDir) && !normalized.startsWith(tempDir))
        throw new FileSystemError(
          "Path outside allowed directories",
          "PATH_ESCAPE"
        );

      return normalized;
    } catch (error) {
      throw new FileSystemError(
        "Path resolution failed",
        "PATH_RESOLUTION_ERROR",
        error
      );
    }
  }

  static validateDataSize(data: string | Buffer): void {
    const size =
      typeof data === "string" ? Buffer.byteLength(data, "utf8") : data.length;
    if (size > InputValidator.MAX_DATA_SIZE)
      throw new CryptoError(
        "Data size exceeds maximum allowed",
        "DATA_TOO_LARGE"
      );
  }

  static validateEncryptedData(data: string): void {
    if (!data || typeof data !== "string")
      throw new CryptoError(
        "Invalid encrypted data format",
        "INVALID_ENCRYPTED_DATA"
      );

    try {
      Buffer.from(data.trim(), CIPHER_ENCODING);
    } catch {
      throw new CryptoError(
        "Invalid encrypted data encoding",
        "INVALID_ENCODING"
      );
    }
  }
}

class FileSystem {
  private readonly appDataDir: string;
  private readonly tempDataDir: string;
  private readonly masterKeyPath: string;
  private readonly auditLogger: SecurityAuditLogger;

  constructor() {
    this.appDataDir = this.getAppDataDirectory();
    this.tempDataDir = path.join(os.tmpdir(), "realm");
    this.masterKeyPath = path.join(this.appDataDir, "master_key.bin");
    this.auditLogger = SecurityAuditLogger.getInstance();
  }

  private getAppDataDirectory(): string {
    const platform = process.platform;
    const homeDir = os.homedir();

    switch (platform) {
      case "win32":
        return path.join(path.join(homeDir, "AppData", "Local"), "realm");
      case "darwin":
        return path.join(homeDir, "Library", "Application Support", "realm");
      case "linux":
      default:
        return path.join(path.join(homeDir, ".config"), "realm");
    }
  }

  async withFileLock<T>(
    filePath: string,
    operation: () => Promise<T>,
    options: { timeout?: number; retries?: number } = {}
  ): Promise<T> {
    const normalizedPath = InputValidator.validateFilePath(filePath);
    const { timeout = 30000, retries = 5 } = options;

    let releaseLock: (() => Promise<void>) | null = null;
    let lockAcquired = false;

    try {
      await this.createSecureDirectory(path.dirname(normalizedPath));

      const lockOptions = {
        retries: {
          retries,
          factor: 2,
          minTimeout: 100,
          maxTimeout: 2000,
          randomize: true,
        },
        stale: timeout,
        realpath: false,
        onCompromised: (err: Error) => {
          this.auditLogger.logSecurityEvent(
            "FILE_LOCK_COMPROMISED",
            "CRITICAL",
            { path: normalizedPath, error: err.message }
          );
          throw new FileSystemError(
            "File lock was compromised - potential security breach",
            "LOCK_COMPROMISED",
            err
          );
        },
      };

      releaseLock = async () => {
        if (lockAcquired) {
          try {
            await unlock(normalizedPath, lockOptions);
            lockAcquired = false;
          } catch (error) {
            this.auditLogger.logSecurityEvent("FILE_UNLOCK_FAILED", "ERROR", {
              path: normalizedPath,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
      };

      await lock(normalizedPath, lockOptions);
      lockAcquired = true;

      this.auditLogger.logSecurityEvent("FILE_LOCK_ACQUIRED", "INFO", {
        path: normalizedPath,
      });

      const result = await operation();

      this.auditLogger.logSecurityEvent("FILE_OPERATION_COMPLETED", "INFO", {
        path: normalizedPath,
      });

      return result;
    } catch (error) {
      this.auditLogger.logSecurityEvent("FILE_OPERATION_FAILED", "ERROR", {
        path: normalizedPath,
        error: error instanceof Error ? error.message : "Unknown error",
        lockAcquired,
      });
      throw new FileSystemError(
        "File operation failed",
        "FILE_OPERATION_ERROR",
        error instanceof Error ? error : undefined
      );
    } finally {
      if (releaseLock) await releaseLock();
    }
  }

  async setSecureFilePermissions(filePath: string): Promise<void> {
    const validatedPath = InputValidator.validateFilePath(filePath);

    try {
      if (process.platform === "win32")
        await this.setWindowsSecurePermissions(validatedPath);
      else await this.setUnixSecurePermissions(validatedPath);

      this.auditLogger.logSecurityEvent("SECURE_PERMISSIONS_SET", "INFO", {
        path: validatedPath,
        platform: process.platform,
      });
    } catch (error) {
      this.auditLogger.logSecurityEvent("SECURE_PERMISSIONS_FAILED", "ERROR", {
        path: validatedPath,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new FileSystemError(
        "Security configuration failed",
        "PERMISSIONS_ERROR",
        error
      );
    }
  }

  private async setWindowsSecurePermissions(filePath: string): Promise<void> {
    const { exec } = await import("child_process");
    const execAsync = promisify(exec);

    try {
      const powershellScript = `
        $path = "${filePath.replace(/"/g, '""')}"
        $acl = Get-Acl $path
        $acl.SetAccessRuleProtection($true, $false)
        $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule($env:USERNAME, "FullControl", "Allow")
        $acl.SetAccessRule($accessRule)
        Set-Acl $path $acl
        
        # Set hidden and system attributes
        $file = Get-Item $path -Force
        $file.Attributes = $file.Attributes -bor [System.IO.FileAttributes]::Hidden -bor [System.IO.FileAttributes]::System
      `;

      await execAsync(`powershell -Command "${powershellScript}"`, {
        timeout: 10000,
      });

      const { stdout } = await execAsync(`icacls "${filePath}"`, {
        timeout: 5000,
      });
      if (!stdout.includes(process.env.USERNAME || ""))
        throw new Error("Failed to verify Windows permissions");
    } catch {
      await execAsync(
        `icacls "${filePath}" /inheritance:d /grant:r "%USERNAME%":(F) /remove:g "Users" /remove:g "Authenticated Users" /remove:g "Everyone" /remove:g "BUILTIN\\Users" /inheritance:r`,
        { timeout: 10000 }
      );
      await execAsync(`attrib +H +S "${filePath}"`, { timeout: 5000 });
    }
  }

  private async setUnixSecurePermissions(filePath: string): Promise<void> {
    await fs.chmod(filePath, 0o600);

    if (process.platform === "linux") {
      try {
        const { exec } = await import("child_process");
        const execAsync = promisify(exec);

        await execAsync(`chattr +i "${filePath}"`, { timeout: 5000 }).catch(
          () => {}
        );

        await execAsync(
          `setfattr -n security.realm -v "protected" "${filePath}"`,
          { timeout: 5000 }
        ).catch(() => {});
      } catch {}
    }
  }

  async createSecureDirectory(dirPath: string): Promise<void> {
    const validatedPath = InputValidator.validateFilePath(dirPath);

    try {
      await fs.access(validatedPath);
      this.auditLogger.logSecurityEvent("DIRECTORY_EXISTS", "INFO", {
        path: validatedPath,
      });
    } catch {
      try {
        await fs.mkdir(validatedPath, { recursive: true, mode: 0o700 });

        if (process.platform !== "win32") await fs.chmod(validatedPath, 0o700);
        else await this.setWindowsSecurePermissions(validatedPath);

        this.auditLogger.logSecurityEvent("SECURE_DIRECTORY_CREATED", "INFO", {
          path: validatedPath,
        });
      } catch (error) {
        this.auditLogger.logSecurityEvent(
          "DIRECTORY_CREATION_FAILED",
          "ERROR",
          {
            path: validatedPath,
            error: error instanceof Error ? error.message : "Unknown error",
          }
        );
        throw new FileSystemError(
          "Directory creation failed",
          "DIR_CREATE_ERROR",
          error
        );
      }
    }
  }

  async secureDeleteFile(filePath: string, passes: number = 3): Promise<void> {
    const validatedPath = InputValidator.validateFilePath(filePath);

    try {
      const stats = await fs.stat(validatedPath);

      for (let i = 0; i < passes; i++) {
        const randomData = randomBytes(stats.size);
        await fs.writeFile(validatedPath, randomData);
        const fd = await fs.open(validatedPath, "r+");
        try {
          await fd.sync();
        } finally {
          await fd.close();
        }
      }

      await fs.unlink(validatedPath);
      this.auditLogger.logSecurityEvent("SECURE_FILE_DELETION", "INFO", {
        path: validatedPath,
        passes,
      });
    } catch (error) {
      this.auditLogger.logSecurityEvent("SECURE_DELETION_FAILED", "WARN", {
        path: validatedPath,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async cleanup(): Promise<void> {
    try {
      await CryptoManager.ensureSodiumReady();
      await fs.access(this.tempDataDir);

      const tempFiles = await fs.readdir(this.tempDataDir);
      const cleanupPromises = tempFiles.map(async (file: string) => {
        const filePath = path.join(this.tempDataDir, file);
        return this.withFileLock(filePath, async () => {
          await this.secureDeleteFile(filePath);
        });
      });

      await Promise.allSettled(cleanupPromises);

      this.auditLogger.logSecurityEvent("TEMP_CLEANUP_COMPLETED", "INFO", {
        filesProcessed: tempFiles.length,
      });
    } catch (error) {
      this.auditLogger.logSecurityEvent("TEMP_CLEANUP_FAILED", "WARN", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
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
    if (buffer && buffer.length > 0) {
      buffer.fill(0);
      buffer.fill(0xff);
      buffer.fill(0);
    }
  }

  static secureZeroUint8Array(array: Uint8Array): void {
    if (array && array.length > 0) {
      array.fill(0);
      array.fill(0xff);
      array.fill(0);
    }
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
    keySize: number
  ): Buffer {
    return Buffer.concat([
      Buffer.from(module, "utf8"),
      Buffer.from(algorithm, "utf8"),
      Buffer.from([keySize]),
      Buffer.from([0x01]),
    ]);
  }

  static async constantTimeDelay(baseDelayMs: number = 50): Promise<void> {
    const jitter = Math.floor(Math.random() * 20);
    const delay = baseDelayMs + jitter;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}

class SecureMemoryManager {
  private static allocatedBuffers = new Map<
    Uint8Array,
    { size: number; timestamp: number }
  >();
  private static isInitialized = false;
  private static totalAllocatedSize = 0;
  private static readonly mutex = new AsyncMutex();

  static async initialize(): Promise<void> {
    if (SecureMemoryManager.isInitialized) return;

    await sodium.ready;
    SecureMemoryManager.isInitialized = true;

    SecurityAuditLogger.getInstance().logSecurityEvent(
      "SECURE_MEMORY_INITIALIZED",
      "INFO",
      { maxPoolSize: MAX_SECURE_MEMORY_POOL_SIZE }
    );
  }

  static async allocate(size: number): Promise<Uint8Array> {
    return SecureMemoryManager.mutex.runExclusive(async () => {
      if (!SecureMemoryManager.isInitialized)
        throw new CryptoError(
          "Secure memory not initialized",
          "MEMORY_NOT_INITIALIZED"
        );

      if (size <= 0 || size > 10 * 1024 * 1024)
        throw new CryptoError(
          "Invalid secure memory allocation size",
          "INVALID_ALLOCATION_SIZE"
        );

      if (
        SecureMemoryManager.totalAllocatedSize + size >
        MAX_SECURE_MEMORY_POOL_SIZE
      ) {
        await SecureMemoryManager.cleanupStaleAllocations();

        if (
          SecureMemoryManager.totalAllocatedSize + size >
          MAX_SECURE_MEMORY_POOL_SIZE
        )
          throw new CryptoError(
            "Secure memory pool exhausted",
            "MEMORY_POOL_EXHAUSTED"
          );
      }

      const buffer = new Uint8Array(size);
      SecureMemoryManager.allocatedBuffers.set(buffer, {
        size,
        timestamp: Date.now(),
      });
      SecureMemoryManager.totalAllocatedSize += size;

      return buffer;
    });
  }

  static async free(buffer: Uint8Array): Promise<void> {
    return SecureMemoryManager.mutex.runExclusive(async () => {
      if (!buffer || buffer.length === 0) return;

      const allocation = SecureMemoryManager.allocatedBuffers.get(buffer);
      if (allocation) {
        SecureMemoryManager.allocatedBuffers.delete(buffer);
        SecureMemoryManager.totalAllocatedSize -= allocation.size;
      }

      MemoryUtils.secureZeroUint8Array(buffer);
    });
  }

  private static async cleanupStaleAllocations(): Promise<void> {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000;

    for (const [
      buffer,
      allocation,
    ] of SecureMemoryManager.allocatedBuffers.entries()) {
      if (now - allocation.timestamp > staleThreshold)
        await SecureMemoryManager.free(buffer);
    }
  }

  static async emergencyCleanup(): Promise<void> {
    return SecureMemoryManager.mutex.runExclusive(async () => {
      for (const buffer of SecureMemoryManager.allocatedBuffers.keys()) {
        try {
          await SecureMemoryManager.free(buffer);
        } catch {}
      }
      SecureMemoryManager.allocatedBuffers.clear();
      SecureMemoryManager.totalAllocatedSize = 0;
    });
  }

  static getStats(): { totalAllocated: number; bufferCount: number } {
    return {
      totalAllocated: SecureMemoryManager.totalAllocatedSize,
      bufferCount: SecureMemoryManager.allocatedBuffers.size,
    };
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
    throw new CryptoError("Invalid master key", "INVALID_MASTER_KEY");

  if (!salt || !Buffer.isBuffer(salt) || salt.length === 0)
    throw new CryptoError("Invalid salt", "INVALID_SALT");

  if (!info || !Buffer.isBuffer(info))
    throw new CryptoError("Invalid info parameter", "INVALID_INFO");

  const hashLength =
    algorithm === "sha256" ? 32 : algorithm === "sha384" ? 48 : 64;
  const maxKeyLength = 255 * hashLength;

  if (keyLength <= 0 || keyLength > maxKeyLength)
    throw new CryptoError(
      `Invalid key length: ${keyLength}. Max for ${algorithm}: ${maxKeyLength}`,
      "INVALID_KEY_LENGTH"
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
  private static isInitialized = false;
  private static keyCache: Uint8Array | null = null;
  private static keyCacheExpiry: number = 0;
  private static readonly KEY_CACHE_TTL = 5 * 60 * 1000;
  private static keyRotationTimer: NodeJS.Timeout | null = null;
  private static readonly cacheMutex = new AsyncMutex();

  private fileSystem: FileSystem;
  private auditLogger: SecurityAuditLogger;

  constructor() {
    this.fileSystem = new FileSystem();
    this.auditLogger = SecurityAuditLogger.getInstance();
  }

  static async ensureSodiumReady(): Promise<void> {
    await sodium.ready;

    if (!CryptoManager.isInitialized) {
      await SecureMemoryManager.initialize();
      CryptoManager.isInitialized = true;

      const requiredFunctions = [
        "randombytes_buf",
        "crypto_secretbox_easy",
        "crypto_secretbox_open_easy",
      ];

      for (const func of requiredFunctions) {
        if (typeof (sodium as Record<string, unknown>)[func] !== "function")
          throw new CryptoError(
            `Required sodium function not available: ${func}`,
            "SODIUM_FUNCTION_MISSING"
          );
      }

      const requiredConstants = [
        "crypto_box_SEALBYTES",
        "crypto_box_PUBLICKEYBYTES",
        "crypto_secretbox_NONCEBYTES",
        "crypto_secretbox_KEYBYTES",
        "crypto_secretbox_MACBYTES",
      ];

      for (const constant of requiredConstants) {
        if (typeof (sodium as Record<string, unknown>)[constant] !== "number")
          throw new CryptoError(
            `Required sodium constant not available: ${constant}`,
            "SODIUM_CONSTANT_MISSING"
          );
      }

      SecurityAuditLogger.getInstance().logSecurityEvent(
        "CRYPTO_MANAGER_INITIALIZED",
        "INFO",
        { sodiumVersion: sodium.sodium_version_string }
      );
    }
  }

  private async generateMasterKey(): Promise<Buffer> {
    await CryptoManager.ensureSodiumReady();

    const masterKey = await SecureMemoryManager.allocate(MASTER_KEY_LENGTH);
    const nonce = await SecureMemoryManager.allocate(
      sodium.crypto_secretbox_NONCEBYTES
    );
    const storageKey = await SecureMemoryManager.allocate(
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

      this.auditLogger.logSecurityEvent("MASTER_KEY_GENERATED", "INFO", {
        keyLength: MASTER_KEY_LENGTH,
      });

      return combined;
    } catch (error) {
      this.auditLogger.logSecurityEvent(
        "MASTER_KEY_GENERATION_FAILED",
        "ERROR",
        { error: error instanceof Error ? error.message : "Unknown error" }
      );
      throw new CryptoError(
        "Key generation failed",
        "KEY_GENERATION_FAILED",
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : undefined
      );
    } finally {
      await SecureMemoryManager.free(masterKey);
      await SecureMemoryManager.free(storageKey);
      await SecureMemoryManager.free(nonce);
    }
  }

  private async loadMasterKey(): Promise<Buffer> {
    await CryptoManager.ensureSodiumReady();
    const masterKeyPath = this.fileSystem.masterKeyFilePath;

    return this.fileSystem.withFileLock(masterKeyPath, async () => {
      let combined: Buffer | null = null;
      const masterKey = await SecureMemoryManager.allocate(MASTER_KEY_LENGTH);

      try {
        await fs.access(masterKeyPath);
      } catch {
        throw new CryptoError("Key file not found", "KEY_FILE_NOT_FOUND");
      }

      try {
        combined = await fs.readFile(masterKeyPath);
        const minSize =
          sodium.crypto_secretbox_NONCEBYTES +
          sodium.crypto_secretbox_KEYBYTES +
          sodium.crypto_secretbox_MACBYTES;

        if (combined.length < minSize)
          throw new CryptoError("Invalid key file format", "INVALID_KEY_FILE");

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

        this.auditLogger.logSecurityEvent("MASTER_KEY_LOADED", "INFO", {
          keyLength: result.length,
        });

        return result;
      } catch (error) {
        this.auditLogger.logSecurityEvent("MASTER_KEY_LOAD_FAILED", "ERROR", {
          error: error instanceof Error ? error.message : "Unknown error",
        });

        await MemoryUtils.constantTimeDelay();
        throw new CryptoError(
          "Key loading failed",
          "KEY_LOAD_FAILED",
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : undefined
        );
      } finally {
        await SecureMemoryManager.free(masterKey);
        if (combined) MemoryUtils.secureZeroBuffer(combined);
      }
    });
  }

  async initializeMasterKey(): Promise<Buffer> {
    return CryptoManager.cacheMutex.runExclusive(async () => {
      if (CryptoManager.keyCache && Date.now() < CryptoManager.keyCacheExpiry) {
        this.auditLogger.logSecurityEvent("MASTER_KEY_CACHE_HIT", "INFO");
        return Buffer.from(CryptoManager.keyCache);
      }

      if (CryptoManager.keyCache) {
        await SecureMemoryManager.free(CryptoManager.keyCache);
        CryptoManager.keyCache = null;
        this.auditLogger.logSecurityEvent("MASTER_KEY_CACHE_EXPIRED", "INFO");
      }

      try {
        const masterKey = await this.loadMasterKey();

        CryptoManager.keyCache = await SecureMemoryManager.allocate(
          masterKey.length
        );
        CryptoManager.keyCache.set(masterKey);
        CryptoManager.keyCacheExpiry = Date.now() + CryptoManager.KEY_CACHE_TTL;

        this.scheduleKeyRotationCheck();

        const result = Buffer.from(masterKey);
        MemoryUtils.secureZeroBuffer(masterKey);
        return result;
      } catch (error) {
        if (
          error instanceof CryptoError &&
          error.code === "KEY_FILE_NOT_FOUND"
        ) {
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
    });
  }

  private scheduleKeyRotationCheck(): void {
    if (CryptoManager.keyRotationTimer)
      clearTimeout(CryptoManager.keyRotationTimer);

    CryptoManager.keyRotationTimer = setTimeout(async () => {
      try {
        await this.checkKeyRotation();
      } catch (error) {
        this.auditLogger.logSecurityEvent("KEY_ROTATION_CHECK_FAILED", "WARN", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }, KEY_ROTATION_INTERVAL);
  }

  private async checkKeyRotation(): Promise<void> {
    try {
      const masterKeyPath = this.fileSystem.masterKeyFilePath;
      const stats = await fs.stat(masterKeyPath);
      const keyAge = Date.now() - stats.mtime.getTime();

      if (keyAge > KEY_ROTATION_INTERVAL)
        this.auditLogger.logSecurityEvent("KEY_ROTATION_RECOMMENDED", "WARN", {
          keyAge: Math.floor(keyAge / (1000 * 60 * 60)),
          maxAge: Math.floor(KEY_ROTATION_INTERVAL / (1000 * 60 * 60)),
        });
    } catch (error) {
      this.auditLogger.logSecurityEvent("KEY_ROTATION_CHECK_ERROR", "ERROR", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  async hkdfKey(
    masterKey: Buffer,
    salt: Buffer,
    info: Buffer,
    keyLength: number
  ): Promise<Buffer> {
    return await hkdfAsync("sha256", masterKey, salt, info, keyLength);
  }

  async encryptData(data: string): Promise<string> {
    InputValidator.validateDataSize(data);

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
        "realm.encryption",
        CIPHER_ALGORITHM,
        CIPHER_KEY_SIZE
      );

      derivedKey = await this.hkdfKey(
        masterKey,
        salt,
        contextInfo,
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

      this.auditLogger.logSecurityEvent("DATA_ENCRYPTED", "INFO", {
        dataSize: data.length,
        algorithm: CIPHER_ALGORITHM,
      });

      return combined.toString(CIPHER_ENCODING);
    } catch (error) {
      this.auditLogger.logSecurityEvent("ENCRYPTION_FAILED", "ERROR", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      await MemoryUtils.constantTimeDelay();
      throw new CryptoError(
        "Encryption operation failed",
        "ENCRYPTION_FAILED",
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : undefined
      );
    } finally {
      if (masterKey) MemoryUtils.secureZeroBuffer(masterKey);
      if (derivedKey) MemoryUtils.secureZeroBuffer(derivedKey);
      if (iv) MemoryUtils.secureZeroBuffer(iv);
      if (salt) MemoryUtils.secureZeroBuffer(salt);
    }
  }

  async decryptData(encryptedData: string): Promise<string> {
    InputValidator.validateEncryptedData(encryptedData);

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
        throw new CryptoError("Invalid data format", "INVALID_DATA_FORMAT");

      salt = combined.subarray(0, SALT_LENGTH);
      iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + CIPHER_IV_SIZE);
      const encrypted = combined.subarray(SALT_LENGTH + CIPHER_IV_SIZE);

      const contextInfo = MemoryUtils.createContext(
        "realm.encryption",
        CIPHER_ALGORITHM,
        CIPHER_KEY_SIZE
      );

      derivedKey = await this.hkdfKey(
        masterKey,
        salt,
        contextInfo,
        CIPHER_KEY_SIZE
      );

      const decipher = createDecipheriv(CIPHER_ALGORITHM, derivedKey, iv);
      let decrypted = decipher.update(encrypted, undefined, "utf8");
      decrypted += decipher.final("utf8");

      this.auditLogger.logSecurityEvent("DATA_DECRYPTED", "INFO", {
        dataSize: decrypted.length,
        algorithm: CIPHER_ALGORITHM,
      });

      return decrypted;
    } catch (error) {
      this.auditLogger.logSecurityEvent("DECRYPTION_FAILED", "ERROR", {
        error: error instanceof Error ? error.message : "Unknown error",
      });

      await MemoryUtils.constantTimeDelay();
      throw new CryptoError(
        "Decryption operation failed",
        "DECRYPTION_FAILED",
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : undefined
      );
    } finally {
      if (masterKey) MemoryUtils.secureZeroBuffer(masterKey);
      if (derivedKey) MemoryUtils.secureZeroBuffer(derivedKey);
      if (combined) MemoryUtils.secureZeroBuffer(combined);
      if (salt) MemoryUtils.secureZeroBuffer(salt);
      if (iv) MemoryUtils.secureZeroBuffer(iv);
    }
  }

  async rotateKey(): Promise<void> {
    return CryptoManager.cacheMutex.runExclusive(async () => {
      try {
        const masterKeyPath = this.fileSystem.masterKeyFilePath;
        const backupPath = `${masterKeyPath}.backup.${Date.now()}`;

        await fs.copyFile(masterKeyPath, backupPath);
        await this.fileSystem.setSecureFilePermissions(backupPath);

        const newKeyData = await this.generateMasterKey();
        await fs.writeFile(masterKeyPath, newKeyData);
        await this.fileSystem.setSecureFilePermissions(masterKeyPath);

        if (CryptoManager.keyCache) {
          await SecureMemoryManager.free(CryptoManager.keyCache);
          CryptoManager.keyCache = null;
        }

        MemoryUtils.secureZeroBuffer(newKeyData);

        this.auditLogger.logSecurityEvent("KEY_ROTATED", "INFO", {
          backupPath,
        });
      } catch (error) {
        this.auditLogger.logSecurityEvent("KEY_ROTATION_FAILED", "ERROR", {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        throw new CryptoError(
          "Key rotation failed",
          "KEY_ROTATION_FAILED",
          error instanceof Error
            ? error.message
            : typeof error === "string"
            ? error
            : undefined
        );
      }
    });
  }

  async cleanup(): Promise<void> {
    await this.fileSystem.cleanup();
  }

  static async shutdown(): Promise<void> {
    try {
      if (CryptoManager.keyRotationTimer) {
        clearTimeout(CryptoManager.keyRotationTimer);
        CryptoManager.keyRotationTimer = null;
      }

      if (CryptoManager.keyCache) {
        await SecureMemoryManager.free(CryptoManager.keyCache);
        CryptoManager.keyCache = null;
      }

      await SecureMemoryManager.emergencyCleanup();

      SecurityAuditLogger.getInstance().logSecurityEvent(
        "CRYPTO_MANAGER_SHUTDOWN",
        "INFO",
        SecureMemoryManager.getStats()
      );
    } catch (error) {
      console.error("Error during crypto manager shutdown:", error);
    }
  }

  getSecurityStatus(): {
    isInitialized: boolean;
    cacheStatus: string;
    memoryStats: { totalAllocated: number; bufferCount: number };
  } {
    return {
      isInitialized: CryptoManager.isInitialized,
      cacheStatus: CryptoManager.keyCache
        ? Date.now() < CryptoManager.keyCacheExpiry
          ? "active"
          : "expired"
        : "empty",
      memoryStats: SecureMemoryManager.getStats(),
    };
  }
}

process.on("exit", () => {
  CryptoManager.shutdown().catch(console.error);
});

process.on("SIGINT", () => {
  CryptoManager.shutdown()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
});

process.on("SIGTERM", () => {
  CryptoManager.shutdown()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
});

process.on("uncaughtException", (error) => {
  SecurityAuditLogger.getInstance().logSecurityEvent(
    "UNCAUGHT_EXCEPTION",
    "CRITICAL",
    { error: error.message, stack: error.stack }
  );

  CryptoManager.shutdown()
    .then(() => process.exit(1))
    .catch(() => process.exit(1));
});

process.on("unhandledRejection", (reason) => {
  SecurityAuditLogger.getInstance().logSecurityEvent(
    "UNHANDLED_REJECTION",
    "CRITICAL",
    { reason: reason instanceof Error ? reason.message : String(reason) }
  );

  CryptoManager.shutdown()
    .then(() => process.exit(1))
    .catch(() => process.exit(1));
});

export {
  CryptoManager,
  FileSystem,
  MemoryUtils,
  InputValidator,
  SecureMemoryManager,
  SecurityAuditLogger,
  CryptoError,
  FileSystemError,
};
