import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export interface CognitoClaims {
  sub: string;
  email?: string;
  'cognito:username'?: string;
}

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  requestContext: APIGatewayProxyEvent['requestContext'] & {
    authorizer?: {
      claims?: CognitoClaims;
    };
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const createResponse = (
  statusCode: number,
  body: ApiResponse
): APIGatewayProxyResult => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  },
  body: JSON.stringify(body),
});

export const successResponse = <T>(data: T, statusCode = 200): APIGatewayProxyResult =>
  createResponse(statusCode, { success: true, data });

export const errorResponse = (error: string, statusCode = 400): APIGatewayProxyResult =>
  createResponse(statusCode, { success: false, error });
