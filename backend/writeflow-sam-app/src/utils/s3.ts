import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({});

export const CONTENT_BUCKET = process.env.CONTENT_BUCKET || 'writeflow-content';

export async function uploadContent(key: string, content: string): Promise<void> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: CONTENT_BUCKET,
      Key: key,
      Body: content,
      ContentType: 'text/html',
    })
  );
}

export async function getContent(key: string): Promise<string> {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: CONTENT_BUCKET,
      Key: key,
    })
  );
  return (await response.Body?.transformToString()) || '';
}

export async function deleteContent(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: CONTENT_BUCKET,
      Key: key,
    })
  );
}

export function generateContentKey(authorId: string, slug: string): string {
  return `posts/${authorId}/${slug}.html`;
}
