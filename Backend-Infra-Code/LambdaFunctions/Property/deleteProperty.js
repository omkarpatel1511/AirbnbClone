import { DynamoDB } from 'aws-sdk';
const dynamodb = new DynamoDB.DocumentClient();

const PROPERTY_TABLE_NAME = process.env.PROPERTY_TABLE_NAME;

export async function handler(event) {
  const body = typeof(event.body) === "string" ? JSON.parse(event.body) : event.body;
  console.log("body: ", body)
  const { propertyId, location} = body;

  try {
    await dynamodb.delete({
      TableName: PROPERTY_TABLE_NAME,
      Key: { propertyId , location },
    }).promise();

    return {
      statusCode: 204,
      body: null,
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not delete listing' }),
    };
  }
}
