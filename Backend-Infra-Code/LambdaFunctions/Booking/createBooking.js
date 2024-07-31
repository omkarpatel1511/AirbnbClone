import { DynamoDB } from 'aws-sdk';
const dynamodb = new DynamoDB.DocumentClient();

const BOOKING_TABLE_NAME = process.env.BOOKING_TABLE_NAME;

//Validate Booking if Concflict with existing.
const validateBooking = o;

export async function handler(event) {
  const body = typeof(event.body) === "string" ? JSON.parse(event.body) : event.body;
  console.log("body: ", body)
  const { bookingId,userId,propertyId,priceperNight,startDate,endDate } = body;

  const newBooking = {
    bookingId,
    userId,
    propertyId,
    priceperNight,
    startDate,
    endDate,
    status: 'CONFIRMED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {

    console.log("newBooking: ", newBooking)
    await dynamodb.put({
      TableName: BOOKING_TABLE_NAME,
      Item: newBooking,
    }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify(newBooking),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Could not create booking' }),
    };
  }
}


