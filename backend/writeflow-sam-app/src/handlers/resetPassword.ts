import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  ConfirmForgotPasswordCommand,
  CodeMismatchException,
  ExpiredCodeException,
  UserNotFoundException,
  InvalidPasswordException,
  LimitExceededException,
} from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse } from '../types/api';

interface ResetPasswordInput {
  email: string;
  code: string;
  newPassword: string;
}

const cognitoClient = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const input: ResetPasswordInput = JSON.parse(event.body);

    if (!input.email || input.email.trim().length === 0) {
      return errorResponse('Email is required', 400);
    }

    if (!input.code || input.code.trim().length === 0) {
      return errorResponse('Reset code is required', 400);
    }

    if (!input.newPassword || input.newPassword.trim().length === 0) {
      return errorResponse('New password is required', 400);
    }

    const command = new ConfirmForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: input.email.toLowerCase(),
      ConfirmationCode: input.code.trim(),
      Password: input.newPassword,
    });

    await cognitoClient.send(command);

    return successResponse({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);

    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    if (error instanceof CodeMismatchException) {
      return errorResponse('Invalid reset code', 400);
    }

    if (error instanceof ExpiredCodeException) {
      return errorResponse('Reset code has expired. Please request a new one', 400);
    }

    if (error instanceof UserNotFoundException) {
      return errorResponse('User not found', 404);
    }

    if (error instanceof InvalidPasswordException) {
      return errorResponse('Password does not meet requirements: minimum 8 characters, uppercase, lowercase, and numbers', 400);
    }

    if (error instanceof LimitExceededException) {
      return errorResponse('Too many attempts. Please try again later', 429);
    }

    return errorResponse('Internal server error', 500);
  }
};
