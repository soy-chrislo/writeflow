import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  NotAuthorizedException,
} from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse } from '../types/api';

interface RefreshTokenInput {
  refreshToken: string;
}

interface AuthTokens {
  accessToken: string;
  idToken: string;
  expiresIn: number;
}

const cognitoClient = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const input: RefreshTokenInput = JSON.parse(event.body);

    if (!input.refreshToken || input.refreshToken.trim().length === 0) {
      return errorResponse('Refresh token is required', 400);
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        REFRESH_TOKEN: input.refreshToken,
      },
    });

    const response = await cognitoClient.send(command);

    if (!response.AuthenticationResult) {
      return errorResponse('Failed to refresh token', 401);
    }

    const tokens: AuthTokens = {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
    };

    return successResponse(tokens);
  } catch (error) {
    console.error('Error refreshing token:', error);

    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    if (error instanceof NotAuthorizedException) {
      return errorResponse('Invalid or expired refresh token', 401);
    }

    return errorResponse('Internal server error', 500);
  }
};
