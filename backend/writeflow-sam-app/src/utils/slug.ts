import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

export async function ensureUniqueSlug(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await slugExists(docClient, tableName, slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

async function slugExists(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  slug: string
): Promise<boolean> {
  const result = await docClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { slug },
      ProjectionExpression: 'slug',
    })
  );
  return !!result.Item;
}
