import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  CodeMismatchException,
  ExpiredCodeException,
  UserNotFoundException,
  NotAuthorizedException,
} from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse } from '../types/api';

interface ConfirmInput {
  email: string;
  code: string;
}

const cognitoClient = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const input: ConfirmInput = JSON.parse(event.body);

    if (!input.email || input.email.trim().length === 0) {
      return errorResponse('Email is required', 400);
    }

    if (!input.code || input.code.trim().length === 0) {
      return errorResponse('Confirmation code is required', 400);
    }

    const command = new ConfirmSignUpCommand({
      ClientId: CLIENT_ID,
      Username: input.email.toLowerCase(),
      ConfirmationCode: input.code.trim(),
    });

    await cognitoClient.send(command);

    return successResponse({ message: 'Account confirmed successfully' });
  } catch (error) {
    console.error('Error confirming user:', error);

    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    if (error instanceof CodeMismatchException) {
      return errorResponse('Invalid confirmation code', 400);
    }

    if (error instanceof ExpiredCodeException) {
      return errorResponse('Confirmation code has expired. Please request a new one', 400);
    }

    if (error instanceof UserNotFoundException) {
      return errorResponse('User not found', 404);
    }

    if (error instanceof NotAuthorizedException) {
      return errorResponse('User is already confirmed', 400);
    }

    return errorResponse('Internal server error', 500);
  }
};
