import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { AuthenticatedEvent, successResponse, errorResponse } from '../types/api';
import { Post } from '../types/post';
import { docClient, POSTS_TABLE } from '../utils/db';
import { getContent } from '../utils/s3';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const slug = event.pathParameters?.slug;

    if (!slug) {
      return errorResponse('Slug is required', 400);
    }

    // Check if this is an authenticated request (via /my/posts/{slug})
    const isAuthenticatedPath = event.path.includes('/my/posts/');
    const authEvent = event as AuthenticatedEvent;
    const userId = authEvent.requestContext.authorizer?.claims?.sub;

    const result = await docClient.send(
      new GetCommand({
        TableName: POSTS_TABLE,
        Key: { slug },
      })
    );

    if (!result.Item) {
      return errorResponse('Post not found', 404);
    }

    const post = result.Item as Post;

    // For authenticated path: user can only see their own posts
    if (isAuthenticatedPath) {
      if (post.authorId !== userId) {
        return errorResponse('Post not found', 404);
      }
    } else {
      // For public path: only published posts are visible
      if (post.status !== 'published') {
        return errorResponse('Post not found', 404);
      }
    }

    const content = await getContent(post.contentKey);

    return successResponse({
      ...post,
      content,
    });
  } catch (error) {
    console.error('Error getting post:', error);
    return errorResponse('Internal server error', 500);
  }
};
