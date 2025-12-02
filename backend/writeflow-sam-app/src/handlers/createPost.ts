import { APIGatewayProxyResult } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { AuthenticatedEvent, successResponse, errorResponse } from '../types/api';
import { Post } from '../types/post';
import { docClient, POSTS_TABLE } from '../utils/db';
import { generateSlug, ensureUniqueSlug } from '../utils/slug';

interface CreatePostInput {
  title: string;
  contentKey: string;
  status?: 'draft' | 'published';
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

    const input: CreatePostInput = JSON.parse(event.body);

    if (!input.title || input.title.trim().length === 0) {
      return errorResponse('Title is required', 400);
    }

    if (!input.contentKey || input.contentKey.trim().length === 0) {
      return errorResponse('Content key is required', 400);
    }

    // Validate contentKey belongs to this user
    const expectedPrefix = `posts/${authorId}/`;
    if (!input.contentKey.startsWith(expectedPrefix)) {
      return errorResponse('Invalid content key', 403);
    }

    const baseSlug = generateSlug(input.title);
    const slug = await ensureUniqueSlug(docClient, POSTS_TABLE, baseSlug);

    const now = new Date().toISOString();
    const status = input.status || 'draft';

    const post: Post = {
      slug,
      title: input.title.trim(),
      authorId,
      status,
      createdAt: now,
      updatedAt: now,
      publishedAt: status === 'published' ? now : undefined,
      contentKey: input.contentKey,
    };

    await docClient.send(
      new PutCommand({
        TableName: POSTS_TABLE,
        Item: post,
        ConditionExpression: 'attribute_not_exists(slug)',
      })
    );

    return successResponse(post, 201);
  } catch (error) {
    console.error('Error creating post:', error);

    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    return errorResponse('Internal server error', 500);
  }
};
