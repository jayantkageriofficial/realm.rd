import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { promisify } from "util";
import { exec } from "child_process";

const ALGORITHM = "aes-256-cbc";
const KEY_SIZE = 32;
const IV_SIZE = 16;
const ENCODING: BufferEncoding = "hex";

const APP_DATA_DIR = path.join(os.homedir(), "AppData", "Local", "revamp");
const TEMP_DATA_DIR = path.join(os.tmpdir(), "revamp");
const PROTECTED_KEY_PATH = path.join(APP_DATA_DIR, "protected_key.bin");
const PROTECTED_IV_PATH = path.join(APP_DATA_DIR, "protected_iv.bin");

const execAsync = promisify(exec);

async function protectData(data: Buffer, outputPath: string): Promise<void> {
  if (process.platform !== "win32")
    throw new Error("DPAPI is only available on Windows");

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const tempInputPath = path.join(
    TEMP_DATA_DIR,
    `temp_input_${Date.now()}.bin`
  );
  fs.writeFileSync(tempInputPath, data);

  try {
    const psScript = `
      Add-Type -AssemblyName System.Security;
      try {
        $bytes = [System.IO.File]::ReadAllBytes("${tempInputPath.replace(
          /\\/g,
          "\\\\"
        )}");
        $encrypted = [System.Security.Cryptography.ProtectedData]::Protect(
          $bytes, 
          $null, 
          [System.Security.Cryptography.DataProtectionScope]::CurrentUser
        );
        
        # Ensure directory exists before writing the file
        $directory = [System.IO.Path]::GetDirectoryName("${outputPath.replace(
          /\\/g,
          "\\\\"
        )}");
        if (-not [System.IO.Directory]::Exists($directory)) {
          [System.IO.Directory]::CreateDirectory($directory);
        }
        
        [System.IO.File]::WriteAllBytes("${outputPath.replace(
          /\\/g,
          "\\\\"
        )}", $encrypted);
        Write-Output "Success";
      } catch {
        Write-Error $_.Exception.Message;
        exit 1;
      }
    `;

    const scriptPath = path.join(
      os.tmpdir(),
      `dpapi_protect_${Date.now()}.ps1`
    );
    fs.writeFileSync(scriptPath, psScript);

    const res = await execAsync(
      `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`,
      { windowsHide: true }
    );

    if (res.stderr) {
      console.error("PowerShell DPAPI protection error:", res.stderr);
      throw new Error(`DPAPI protection failed: ${res.stderr}`);
    }
    if (!fs.existsSync(outputPath)) {
      throw new Error(
        `DPAPI protection failed: Output file was not created at ${outputPath}`
      );
    }
  } finally {
    if (fs.existsSync(tempInputPath)) {
      try {
        fs.unlinkSync(tempInputPath);
      } catch {}
    }
  }
}

async function unprotectData(inputPath: string): Promise<Buffer> {
  if (process.platform !== "win32")
    throw new Error("DPAPI is only available on Windows");

  const tempOutputPath = path.join(
    TEMP_DATA_DIR,
    `temp_output_${Date.now()}.bin`
  );

  try {
    const psScript = `
    Add-Type -AssemblyName System.Security;
    try {
      $encrypted = [System.IO.File]::ReadAllBytes("${inputPath.replace(
        /\\/g,
        "\\\\"
      )}");
      $decrypted = [System.Security.Cryptography.ProtectedData]::Unprotect(
        $encrypted, 
        $null, 
        [System.Security.Cryptography.DataProtectionScope]::CurrentUser
      );
      
      # Ensure directory exists before writing the file
      $directory = [System.IO.Path]::GetDirectoryName("${tempOutputPath.replace(
        /\\/g,
        "\\\\"
      )}");
      if (-not [System.IO.Directory]::Exists($directory)) {
        [System.IO.Directory]::CreateDirectory($directory);
      }
      
      [System.IO.File]::WriteAllBytes("${tempOutputPath.replace(
        /\\/g,
        "\\\\"
      )}", $decrypted);
      Write-Output "Success";
    } catch {
      Write-Error $_.Exception.Message;
      exit 1;
    }
  `;
    const scriptPath = path.join(
      os.tmpdir(),
      `dpapi_unprotect_${Date.now()}.ps1`
    );
    fs.writeFileSync(scriptPath, psScript);

    const res = await execAsync(
      `powershell -ExecutionPolicy Bypass -File "${scriptPath}"`,
      { windowsHide: true }
    );

    if (res.stderr) {
      console.error("PowerShell DPAPI unprotection error:", res.stderr);
      throw new Error(`DPAPI unprotection failed: ${res.stderr}`);
    }

    if (!fs.existsSync(tempOutputPath)) {
      throw new Error(
        `DPAPI unprotection failed: Output file was not created at ${tempOutputPath}`
      );
    }

    return fs.readFileSync(tempOutputPath);
  } catch (error) {
    console.error("Error during DPAPI unprotection:", error);
    throw error;
  } finally {
    if (fs.existsSync(tempOutputPath)) {
      try {
        fs.unlinkSync(tempOutputPath);
      } catch {}
    }
  }
}

async function initializeEncryption(): Promise<void> {
  if (!fs.existsSync(APP_DATA_DIR))
    fs.mkdirSync(APP_DATA_DIR, { recursive: true });
  if (!fs.existsSync(TEMP_DATA_DIR))
    fs.mkdirSync(TEMP_DATA_DIR, { recursive: true });
  if (!fs.existsSync(PROTECTED_KEY_PATH))
    await protectData(crypto.randomBytes(KEY_SIZE), PROTECTED_KEY_PATH);
  if (!fs.existsSync(PROTECTED_IV_PATH))
    await protectData(crypto.randomBytes(IV_SIZE), PROTECTED_IV_PATH);
}

async function encryptData(data: string): Promise<string> {
  await initializeEncryption();

  const key = await unprotectData(PROTECTED_KEY_PATH);
  const iv = await unprotectData(PROTECTED_IV_PATH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(data, "utf8", ENCODING);
  encrypted += cipher.final(ENCODING);

  return encrypted;
}

async function decryptData(encryptedData: string): Promise<string> {
  await initializeEncryption();

  const key = await unprotectData(PROTECTED_KEY_PATH);
  const iv = await unprotectData(PROTECTED_IV_PATH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encryptedData, ENCODING, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export { encryptData, decryptData };
