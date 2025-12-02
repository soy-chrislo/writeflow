import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AuthenticatedEvent, successResponse, errorResponse } from '../types/api';
import { Post, PostListItem } from '../types/post';
import { docClient, POSTS_TABLE } from '../utils/db';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const path = event.path;
    const isMyPosts = path.includes('/my/posts');

    const limit = Math.min(parseInt(event.queryStringParameters?.limit || '20', 10), 100);
    const nextToken = event.queryStringParameters?.nextToken;
    const statusFilter = event.queryStringParameters?.status;

    let exclusiveStartKey: Record<string, unknown> | undefined;
    if (nextToken) {
      try {
        exclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
      } catch {
        return errorResponse('Invalid pagination token', 400);
      }
    }

    if (isMyPosts) {
      // Authenticated endpoint: list user's posts
      const authEvent = event as AuthenticatedEvent;
      const authorId = authEvent.requestContext.authorizer?.claims?.sub;

      if (!authorId) {
        return errorResponse('Unauthorized', 401);
      }

      const result = await docClient.send(
        new QueryCommand({
          TableName: POSTS_TABLE,
          IndexName: 'author-index',
          KeyConditionExpression: 'authorId = :authorId',
          FilterExpression: statusFilter ? '#status = :status' : undefined,
          ExpressionAttributeNames: statusFilter ? { '#status': 'status' } : undefined,
          ExpressionAttributeValues: {
            ':authorId': authorId,
            ...(statusFilter && { ':status': statusFilter }),
          },
          Limit: limit,
          ExclusiveStartKey: exclusiveStartKey,
          ScanIndexForward: false,
        })
      );

      const posts = (result.Items || []) as Post[];
      const postList: PostListItem[] = posts.map(mapToPostListItem);

      return successResponse({
        posts: postList,
        nextToken: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : undefined,
      });
    } else {
      // Public endpoint: list published posts only
      const result = await docClient.send(
        new QueryCommand({
          TableName: POSTS_TABLE,
          IndexName: 'status-index',
          KeyConditionExpression: '#status = :status',
          ExpressionAttributeNames: { '#status': 'status' },
          ExpressionAttributeValues: { ':status': 'published' },
          Limit: limit,
          ExclusiveStartKey: exclusiveStartKey,
          ScanIndexForward: false,
        })
      );

      const posts = (result.Items || []) as Post[];
      const postList: PostListItem[] = posts.map(mapToPostListItem);

      return successResponse({
        posts: postList,
        nextToken: result.LastEvaluatedKey
          ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64')
          : undefined,
      });
    }
  } catch (error) {
    console.error('Error listing posts:', error);
    return errorResponse('Internal server error', 500);
  }
};

function mapToPostListItem(post: Post): PostListItem {
  return {
    slug: post.slug,
    title: post.title,
    status: post.status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    publishedAt: post.publishedAt,
  };
}
