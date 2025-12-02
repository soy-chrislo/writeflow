import { APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { AuthenticatedEvent, successResponse, errorResponse } from '../types/api';
import { Post } from '../types/post';
import { docClient, POSTS_TABLE } from '../utils/db';

interface UpdatePostInput {
  title?: string;
  contentKey?: string;
  status?: 'draft' | 'published';
}

export const handler = async (event: AuthenticatedEvent): Promise<APIGatewayProxyResult> => {
  try {
    const authorId = event.requestContext.authorizer?.claims?.sub;
    if (!authorId) {
      return errorResponse('Unauthorized', 401);
    }

    const slug = event.pathParameters?.slug;
    if (!slug) {
      return errorResponse('Slug is required', 400);
    }

    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const input: UpdatePostInput = JSON.parse(event.body);

    // Fetch existing post
    const existingResult = await docClient.send(
      new GetCommand({
        TableName: POSTS_TABLE,
        Key: { slug },
      })
    );

    if (!existingResult.Item) {
      return errorResponse('Post not found', 404);
    }

    const existingPost = existingResult.Item as Post;

    // Check ownership
    if (existingPost.authorId !== authorId) {
      return errorResponse('You do not have permission to update this post', 403);
    }

    const now = new Date().toISOString();
    const updateExpressions: string[] = ['#updatedAt = :updatedAt'];
    const expressionAttributeNames: Record<string, string> = { '#updatedAt': 'updatedAt' };
    const expressionAttributeValues: Record<string, unknown> = { ':updatedAt': now };

    if (input.title !== undefined) {
      updateExpressions.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = input.title.trim();
    }

    if (input.contentKey !== undefined) {
      // Validate contentKey belongs to this user
      const expectedPrefix = `posts/${authorId}/`;
      if (!input.contentKey.startsWith(expectedPrefix)) {
        return errorResponse('Invalid content key', 403);
      }
      updateExpressions.push('#contentKey = :contentKey');
      expressionAttributeNames['#contentKey'] = 'contentKey';
      expressionAttributeValues[':contentKey'] = input.contentKey;
    }

    if (input.status !== undefined) {
      updateExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = input.status;

      // Set publishedAt when publishing for the first time
      if (input.status === 'published' && !existingPost.publishedAt) {
        updateExpressions.push('#publishedAt = :publishedAt');
        expressionAttributeNames['#publishedAt'] = 'publishedAt';
        expressionAttributeValues[':publishedAt'] = now;
      }
    }

    const result = await docClient.send(
      new UpdateCommand({
        TableName: POSTS_TABLE,
        Key: { slug },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return successResponse(result.Attributes as Post);
  } catch (error) {
    console.error('Error updating post:', error);

    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    return errorResponse('Internal server error', 500);
  }
};
