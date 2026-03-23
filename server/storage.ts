/**
 * Storage helpers — supports local file storage and direct S3.
 * Replaces Manus Forge storage proxy.
 *
 * storageGet      → returns a presigned URL (S3) or public URL (local) for reading.
 * storageGetSignedUrl → always returns a time-limited presigned URL (S3 mode) or
 *                       a public URL (local mode). Used for secure CSV downloads.
 * storagePut      → uploads a file to S3 or local storage.
 */
import { ENV } from './_core/env';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// ─── Local Storage ──────────────────────────────────────────────────

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

async function localPut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType: string
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const filePath = path.join(ENV.storagePath, key);
  ensureDir(path.dirname(filePath));

  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  fs.writeFileSync(filePath, buffer);

  const url = `${ENV.storageUrl}/${key}`;
  return { key, url };
}

async function localGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  return { key, url: `${ENV.storageUrl}/${key}` };
}

// ─── S3 Storage ─────────────────────────────────────────────────────

let _s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!_s3Client) {
    _s3Client = new S3Client({
      region: ENV.s3Region,
      credentials: {
        accessKeyId: ENV.s3AccessKey,
        secretAccessKey: ENV.s3SecretKey,
      },
    });
  }
  return _s3Client;
}

async function s3Put(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const client = getS3Client();
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);

  await client.send(new PutObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  const url = `https://${ENV.s3Bucket}.s3.${ENV.s3Region}.amazonaws.com/${key}`;
  return { key, url };
}

async function s3Get(relKey: string): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: key,
  });
  const url = await getSignedUrl(client, command, { expiresIn: 3600 });
  return { key, url };
}

/**
 * Generate a presigned URL for S3 with a custom expiration time.
 * Falls back to public URL in local storage mode.
 */
async function s3GetSignedUrl(relKey: string, expiresIn: number): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: ENV.s3Bucket,
    Key: key,
  });
  const url = await getSignedUrl(client, command, { expiresIn });
  return { key, url };
}

// ─── Public API ─────────────────────────────────────────────────────

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (ENV.storageMode === "s3") {
    return s3Put(relKey, data, contentType);
  }
  return localPut(relKey, data, contentType);
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  if (ENV.storageMode === "s3") {
    return s3Get(relKey);
  }
  return localGet(relKey);
}

/**
 * Get a presigned URL for secure, time-limited file access.
 * S3 mode: generates a presigned URL with the specified expiration (default 900s = 15 min).
 * Local mode: returns the public URL (no presigning available).
 */
export async function storageGetSignedUrl(
  relKey: string,
  expiresIn = 900
): Promise<{ key: string; url: string }> {
  if (ENV.storageMode === "s3") {
    return s3GetSignedUrl(relKey, expiresIn);
  }
  return localGet(relKey);
}
