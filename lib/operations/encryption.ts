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

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import sodium from "libsodium-wrappers";
import Config from "@/lib/constant";

const APP_DATA_DIR = path.join(os.homedir(), "AppData", "Local", "realm");
const TEMP_DATA_DIR = path.join(os.tmpdir(), "realm");
const KEY_PATH = path.join(APP_DATA_DIR, "cipher_key.bin");
const IV_PATH = path.join(APP_DATA_DIR, "cipher_iv.bin");

async function protectData(data: Buffer, outputPath: string): Promise<void> {
	await sodium.ready;
	const outputDir = path.dirname(outputPath);
	if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

	const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
	const key = sodium.randombytes_buf(sodium.crypto_secretbox_KEYBYTES);
	const encrypted = sodium.crypto_secretbox_easy(data, nonce, key);

	const combined = Buffer.concat([nonce, key, encrypted]);
	fs.writeFileSync(outputPath, combined, { mode: 0o600 });
}

async function unprotectData(inputPath: string): Promise<Buffer> {
	await sodium.ready;

	if (!fs.existsSync(inputPath))
		throw new Error(`File not found: ${inputPath}`);

	const combined = fs.readFileSync(inputPath);

	const nonce = combined.slice(0, sodium.crypto_secretbox_NONCEBYTES);
	const key = combined.slice(
		sodium.crypto_secretbox_NONCEBYTES,
		sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_KEYBYTES,
	);
	const encrypted = combined.slice(
		sodium.crypto_secretbox_NONCEBYTES + sodium.crypto_secretbox_KEYBYTES,
	);

	const decrypted = sodium.crypto_secretbox_open_easy(encrypted, nonce, key);
	return Buffer.from(decrypted);
}

async function initializeEncryption(): Promise<void> {
	await sodium.ready;

	if (!fs.existsSync(APP_DATA_DIR))
		fs.mkdirSync(APP_DATA_DIR, { recursive: true });
	if (!fs.existsSync(TEMP_DATA_DIR))
		fs.mkdirSync(TEMP_DATA_DIR, { recursive: true });

	if (!fs.existsSync(KEY_PATH))
		await protectData(
			Buffer.from(sodium.randombytes_buf(Config.CIPHER_KEY_SIZE)),
			KEY_PATH,
		);
	if (!fs.existsSync(IV_PATH))
		await protectData(
			Buffer.from(sodium.randombytes_buf(Config.CIPHER_IV_SIZE)),
			IV_PATH,
		);
}

async function encryptData(data: string): Promise<string> {
	await initializeEncryption();
	const key = await unprotectData(KEY_PATH);
	const iv = await unprotectData(IV_PATH);

	const cipher = crypto.createCipheriv(Config.CIPHER_ALGORITHM, key, iv);
	let encrypted = cipher.update(data, "utf8", Config.CIPHER_ENCODING);
	encrypted += cipher.final(Config.CIPHER_ENCODING);

	return encrypted;
}

async function decryptData(encryptedData: string): Promise<string> {
	await initializeEncryption();
	const key = await unprotectData(KEY_PATH);
	const iv = await unprotectData(IV_PATH);

	const decipher = crypto.createDecipheriv(Config.CIPHER_ALGORITHM, key, iv);
	let decrypted = decipher.update(
		encryptedData,
		Config.CIPHER_ENCODING,
		"utf8",
	);
	decrypted += decipher.final("utf8");

	return decrypted;
}

export { encryptData, decryptData };
