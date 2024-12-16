import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import path = require('path');
import * as iam from 'aws-cdk-lib/aws-iam';


interface BookingServiceStackProps extends cdk.StackProps {
  stage: string
}

export class BookingServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: BookingServiceStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // DynamoDB Table for booking Data
    const bookingTable = new dynamodb.Table(this, 'bookingTable', {
      partitionKey: { name: 'bookingId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'startDate', type: dynamodb.AttributeType.STRING },
      tableName: `bookingTable-${stage}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Note: Set to RETAIN for production
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });


    // Lambda Function for Creating booking
    console.log("__dirname: ", __dirname)
    const createbookingFunction = new lambdaNodejs.NodejsFunction(this, 'CreatebookingFunction', {
      functionName: `CreatebookingFunction-${stage}`,
      entry: 'LambdaFunctions/booking/createbooking.js',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      depsLockFilePath:'package-lock.json',
      environment: {
        BOOKING_TABLE_NAME: bookingTable.tableName,
      },
    });

    // Lambda Function for Getting booking
    const getbookingFunction = new lambdaNodejs.NodejsFunction(this, 'GetbookingFunction', {
      functionName: `GetbookingFunction-${stage}`,
      entry: 'LambdaFunctions/Booking/getBooking.js',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      depsLockFilePath:'package-lock.json',
      environment: {
        BOOKING_TABLE_NAME: bookingTable.tableName,
      },
    });

    // Lambda Function for Updating booking
    const updatebookingFunction = new lambdaNodejs.NodejsFunction(this, 'UpdatebookingFunction', {
      functionName: `UpdatebookingFunction-${stage}`,
      entry: 'LambdaFunctions/Booking/updateBooking.js',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      depsLockFilePath:'package-lock.json',
      environment: {
        BOOKING_TABLE_NAME: bookingTable.tableName,
      },
    });

    // Lambda Function for Cancel booking
    const deletebookingFunction = new lambdaNodejs.NodejsFunction(this, 'deletebookingFunction', {
      functionName: `deletebookingFunction-${stage}`,
      entry: 'LambdaFunctions/Booking/deleteBooking.js',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      depsLockFilePath:'package-lock.json',
      environment: {
        BOOKING_TABLE_NAME: bookingTable.tableName,
      },
    }); 

    // Grant permissions to Lambda functions
    bookingTable.grantReadWriteData(createbookingFunction);
    bookingTable.grantReadData(getbookingFunction);
    bookingTable.grantReadWriteData(updatebookingFunction);
    bookingTable.grantReadWriteData(deletebookingFunction);

    // Create IAM Role for API Gateway
    const apiGatewayRole = new iam.Role(this, 'ApiGatewayRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    // Attach policies to the role
    apiGatewayRole.addToPolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [createbookingFunction.functionArn, getbookingFunction.functionArn, updatebookingFunction.functionArn, deletebookingFunction.functionArn],
    }));

    // API Gateway for booking Service
    const api = new apigateway.RestApi(this, 'bookingApi', {
      restApiName: `bookingService-${stage}`,
      description: 'This service handles booking operations for the Airbnb clone.',
    });

    // API Gateway Integration with Lambda
    const createbookingIntegration = new apigateway.LambdaIntegration(createbookingFunction);

    const bookingApiResource = api.root.addResource('booking');
    bookingApiResource.addMethod('POST', createbookingIntegration); // POST /booking

    const getbookingIntegration = new apigateway.LambdaIntegration(getbookingFunction);
    const updatebookingIntegration = new apigateway.LambdaIntegration(updatebookingFunction);
    const deletebookingIntegration = new apigateway.LambdaIntegration(deletebookingFunction);

    const bookingIdResouce = bookingApiResource.addResource('{bookingId}')
    bookingIdResouce.addMethod('GET', getbookingIntegration); // GET /booking/{bookingId}
    bookingIdResouce.addMethod('PUT', updatebookingIntegration); // PUT /booking/{bookingId}
    bookingIdResouce.addMethod('CANCEL', deletebookingIntegration); // CANCEL /booking/{bookingId}

    // Outputs
    new cdk.CfnOutput(this, 'bookingApiUrl', {
      value: api.url,
      description: 'The URL of the booking API Gateway',
    });
  }
}

const app = new cdk.App();
new BookingServiceStack(app, 'BookingServiceStack', {
  stage: 'dev',  // Replace with your stage value
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
}, 
});
