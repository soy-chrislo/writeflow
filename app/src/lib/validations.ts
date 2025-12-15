import { z } from "zod";

/**
 * Post form validation schema
 */
export const postFormSchema = z.object({
	title: z
		.string()
		.min(1, "Title is required")
		.max(200, "Title cannot exceed 200 characters"),
	content: z.string(),
});

export type PostFormValues = z.infer<typeof postFormSchema>;

/**
 * AWS Cognito default password requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 *
 * @see https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-policies.html
 */
export const passwordSchema = z
	.string()
	.min(8, "Password must be at least 8 characters")
	.regex(/[a-z]/, "Password must contain at least one lowercase letter")
	.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
	.regex(/[0-9]/, "Password must contain at least one number")
	.regex(
		/[^a-zA-Z0-9]/,
		"Password must contain at least one special character",
	);
