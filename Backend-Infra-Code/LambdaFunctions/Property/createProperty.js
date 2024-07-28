import { DynamoDB } from 'aws-sdk';
const dynamodb = new DynamoDB.DocumentClient();

const PROPERTY_TABLE_NAME = process.env.PROPERTY_TABLE_NAME;

export async function handler(event) {
  const body = typeof(event.body) === "string" ? JSON.parse(event.body) : event.body;
  console.log("body: ", body)
  const { propertyId, userId, title, description, location, noOfBedrooms, noOfbathrooms, maxGuests, amenities } = body;

  const newProperty = {
    propertyId,
    location,
    hostId: userId,
    title,
    description,
    noOfBedrooms,
    noOfbathrooms,
    maxGuests,
    amenities,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {

    console.log("newProperty: ", newProperty)
    await dynamodb.put({
      TableName: PROPERTY_TABLE_NAME,
      Item: newProperty,
    }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify(newProperty),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create listing' }),
    };
  }
}


