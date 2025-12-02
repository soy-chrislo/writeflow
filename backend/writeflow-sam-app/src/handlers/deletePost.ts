import { APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { AuthenticatedEvent, successResponse, errorResponse } from '../types/api';
import { Post } from '../types/post';
import { docClient, POSTS_TABLE } from '../utils/db';
import { deleteContent } from '../utils/s3';

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
      return errorResponse('You do not have permission to delete this post', 403);
    }

    // Delete content from S3
    await deleteContent(existingPost.contentKey);

    // Delete from DynamoDB
    await docClient.send(
      new DeleteCommand({
        TableName: POSTS_TABLE,
        Key: { slug },
      })
    );

    return successResponse({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    return errorResponse('Internal server error', 500);
  }
};
