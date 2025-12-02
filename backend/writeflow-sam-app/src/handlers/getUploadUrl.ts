import { APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AuthenticatedEvent, successResponse, errorResponse } from '../types/api';
import { generateContentKey } from '../utils/s3';

const s3Client = new S3Client({});
const CONTENT_BUCKET = process.env.CONTENT_BUCKET || 'writeflow-content';
const PRESIGNED_URL_EXPIRATION = 300; // 5 minutes

interface GetUploadUrlInput {
  slug: string;
  contentType?: string;
}

export const handler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authorId = event.requestContext.authorizer?.claims?.sub;
    if (!authorId) {
      return errorResponse('Unauthorized', 401);
    }

    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const input: GetUploadUrlInput = JSON.parse(event.body);

    if (!input.slug || input.slug.trim().length === 0) {
      return errorResponse('Slug is required', 400);
    }

    const contentKey = generateContentKey(authorId, input.slug);
    const contentType = input.contentType || 'text/html';

    const command = new PutObjectCommand({
      Bucket: CONTENT_BUCKET,
      Key: contentKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRATION,
    });

    return successResponse({
      uploadUrl,
      contentKey,
      expiresIn: PRESIGNED_URL_EXPIRATION,
    });
  } catch (error) {
    console.error('Error generating upload URL:', error);

    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    return errorResponse('Internal server error', 500);
  }
};
