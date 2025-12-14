import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  NotAuthorizedException,
  UserNotFoundException,
  UserNotConfirmedException,
} from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse } from '../types/api';

interface LoginInput {
  email: string;
  password: string;
}

interface LoginOutput {
  accessToken: string;
  idToken: string;
  refreshToken: string;
  expiresIn: number;
}

const cognitoClient = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const input: LoginInput = JSON.parse(event.body);

    if (!input.email || input.email.trim().length === 0) {
      return errorResponse('Email is required', 400);
    }

    if (!input.password || input.password.trim().length === 0) {
      return errorResponse('Password is required', 400);
    }

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: CLIENT_ID,
      AuthParameters: {
        USERNAME: input.email.toLowerCase(),
        PASSWORD: input.password,
      },
    });

    const response = await cognitoClient.send(command);

    if (!response.AuthenticationResult) {
      return errorResponse('Authentication failed', 401);
    }

    const result: LoginOutput = {
      accessToken: response.AuthenticationResult.AccessToken!,
      idToken: response.AuthenticationResult.IdToken!,
      refreshToken: response.AuthenticationResult.RefreshToken!,
      expiresIn: response.AuthenticationResult.ExpiresIn || 3600,
    };

    return successResponse(result);
  } catch (error) {
    console.error('Error logging in:', error);

    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    if (error instanceof NotAuthorizedException) {
      return errorResponse('Invalid email or password', 401);
    }

    if (error instanceof UserNotFoundException) {
      return errorResponse('Invalid email or password', 401);
    }

    if (error instanceof UserNotConfirmedException) {
      return errorResponse('Account not confirmed. Please check your email for the confirmation code', 403);
    }

    return errorResponse('Internal server error', 500);
  }
};
