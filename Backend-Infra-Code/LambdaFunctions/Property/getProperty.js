import { DynamoDB } from 'aws-sdk';
const dynamodb = new DynamoDB.DocumentClient();

const PROPERTY_TABLE_NAME = process.env.PROPERTY_TABLE_NAME;

export async function handler(event) {
  const body = typeof(event.body) === "string" ? JSON.parse(event.body) : event.body;
  console.log("body: ", body)
  const { propertyId, location} = body;

  try {
    const result = await dynamodb.get({
      TableName: PROPERTY_TABLE_NAME,
      Key: { propertyId, location },
    }).promise();

    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'property not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not retrieve property' }),
    };
  }
}
