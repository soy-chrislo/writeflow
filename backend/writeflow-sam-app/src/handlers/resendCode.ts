import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  ResendConfirmationCodeCommand,
  UserNotFoundException,
  InvalidParameterException,
  LimitExceededException,
} from '@aws-sdk/client-cognito-identity-provider';
import { successResponse, errorResponse } from '../types/api';

interface ResendCodeInput {
  email: string;
}

const cognitoClient = new CognitoIdentityProviderClient({});
const CLIENT_ID = process.env.COGNITO_CLIENT_ID!;
const PUBLIC_REGISTRATION_ENABLED = process.env.PUBLIC_REGISTRATION_ENABLED === 'true';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!PUBLIC_REGISTRATION_ENABLED) {
      return errorResponse('Public registration is disabled. Please contact the administrator.', 403);
    }

    if (!event.body) {
      return errorResponse('Request body is required', 400);
    }

    const input: ResendCodeInput = JSON.parse(event.body);

    if (!input.email || input.email.trim().length === 0) {
      return errorResponse('Email is required', 400);
    }

    const command = new ResendConfirmationCodeCommand({
      ClientId: CLIENT_ID,
      Username: input.email.toLowerCase(),
    });

    const response = await cognitoClient.send(command);

    return successResponse({
      message: 'Confirmation code sent',
      destination: response.CodeDeliveryDetails?.Destination,
      deliveryMedium: response.CodeDeliveryDetails?.DeliveryMedium,
    });
  } catch (error) {
    console.error('Error resending code:', error);

    if (error instanceof SyntaxError) {
      return errorResponse('Invalid JSON in request body', 400);
    }

    if (error instanceof UserNotFoundException) {
      return errorResponse('User not found', 404);
    }

    if (error instanceof InvalidParameterException) {
      return errorResponse('User is already confirmed', 400);
    }

    if (error instanceof LimitExceededException) {
      return errorResponse('Too many requests. Please try again later', 429);
    }

    return errorResponse('Internal server error', 500);
  }
};
