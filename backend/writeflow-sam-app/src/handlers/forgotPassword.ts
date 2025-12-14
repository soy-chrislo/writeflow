import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  ForgotPasswordCommand,
  UserNotFoundException,
  LimitExceededException,
  InvalidParameterException,
} from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse } from '../types/api';

interface ForgotPasswordInput {
  email: string;
}

const cognitoClient = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const input: ForgotPasswordInput = JSON.parse(event.body);

    if (!input.email || input.email.trim().length === 0) {
      return errorResponse('Email is required', 400);
    }

    const command = new ForgotPasswordCommand({
      ClientId: CLIENT_ID,
      Username: input.email.toLowerCase(),
    });

    const response = await cognitoClient.send(command);

    return successResponse({
      message: 'Password reset code sent',
      destination: response.CodeDeliveryDetails?.Destination,
      deliveryMedium: response.CodeDeliveryDetails?.DeliveryMedium,
    });
  } catch (error) {
    console.error('Error initiating password reset:', error);

    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    if (error instanceof UserNotFoundException) {
      // Return success even if user not found to prevent user enumeration
      return successResponse({
        message: 'If an account exists with this email, a password reset code has been sent',
      });
    }

    if (error instanceof InvalidParameterException) {
      return errorResponse('Cannot reset password for unverified user', 400);
    }

    if (error instanceof LimitExceededException) {
      return errorResponse('Too many requests. Please try again later', 429);
    }

    return errorResponse('Internal server error', 500);
  }
};
