import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  UsernameExistsException,
  InvalidPasswordException,
  InvalidParameterException,
} from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse } from '../types/api';

interface RegisterInput {
  email: string;
  password: string;
}

interface RegisterOutput {
  userId: string;
  email: string;
  confirmed: boolean;
}

const cognitoClient = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const input: RegisterInput = JSON.parse(event.body);

    if (!input.email || input.email.trim().length === 0) {
      return errorResponse('Email is required', 400);
    }

    if (!input.password || input.password.trim().length === 0) {
      return errorResponse('Password is required', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return errorResponse('Invalid email format', 400);
    }

    const command = new SignUpCommand({
      ClientId: CLIENT_ID,
      Username: input.email.toLowerCase(),
      Password: input.password,
      UserAttributes: [
        {
          Name: 'email',
          Value: input.email.toLowerCase(),
        },
      ],
    });

    const response = await cognitoClient.send(command);

    const result: RegisterOutput = {
      userId: response.UserSub!,
      email: input.email.toLowerCase(),
      confirmed: response.UserConfirmed || false,
    };

    return successResponse(result, 201);
  } catch (error) {
    console.error('Error registering user:', error);

    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    if (error instanceof UsernameExistsException) {
      return errorResponse('An account with this email already exists', 409);
    }

    if (error instanceof InvalidPasswordException) {
      return errorResponse('Password does not meet requirements: minimum 8 characters, uppercase, lowercase, and numbers', 400);
    }

    if (error instanceof InvalidParameterException) {
      return errorResponse('Invalid parameters provided', 400);
    }

    return errorResponse('Internal server error', 500);
  }
};
