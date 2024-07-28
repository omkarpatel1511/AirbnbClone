import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import path = require('path');
import * as iam from 'aws-cdk-lib/aws-iam';


interface PropertyServiceStackProps extends cdk.StackProps {
  stage: string
}

export class PropertyServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PropertyServiceStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // DynamoDB Table for property Data
    const propertyTable = new dynamodb.Table(this, 'propertyTable', {
      partitionKey: { name: 'location', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'propertyId', type: dynamodb.AttributeType.STRING },
      tableName: `propertyTable-${stage}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Note: Set to RETAIN for production
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });


    // Lambda Function for Creating property
    console.log("__dirname: ", __dirname)
    const createpropertyFunction = new lambdaNodejs.NodejsFunction(this, 'CreatepropertyFunction', {
      functionName: `CreatepropertyFunction-${stage}`,
      entry: 'LambdaFunctions/Property/createProperty.js',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      depsLockFilePath:'package-lock.json',
      environment: {
        PROPERTY_TABLE_NAME: propertyTable.tableName,
      },
    });


    

    // Lambda Function for Getting property
    const getpropertyFunction = new lambdaNodejs.NodejsFunction(this, 'GetpropertyFunction', {
      functionName: `GetpropertyFunction-${stage}`,
      entry: 'LambdaFunctions/Property/getProperty.js',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      depsLockFilePath:'package-lock.json',
      environment: {
        PROPERTY_TABLE_NAME: propertyTable.tableName,
      },
    });

    // Lambda Function for Updating property
    const updatepropertyFunction = new lambdaNodejs.NodejsFunction(this, 'UpdatepropertyFunction', {
      functionName: `UpdatepropertyFunction-${stage}`,
      entry: 'LambdaFunctions/Property/getProperty.js',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      depsLockFilePath:'package-lock.json',
      environment: {
        PROPERTY_TABLE_NAME: propertyTable.tableName,
      },
    });

    // Lambda Function for Deleting property
    const deletepropertyFunction = new lambdaNodejs.NodejsFunction(this, 'DeletepropertyFunction', {
      functionName: `DeletepropertyFunction-${stage}`,
      entry: 'LambdaFunctions/Property/deleteProperty.js',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      depsLockFilePath:'package-lock.json',
      environment: {
        PROPERTY_TABLE_NAME: propertyTable.tableName,
      },
    }); 

    // Grant permissions to Lambda functions
    propertyTable.grantReadWriteData(createpropertyFunction);
    propertyTable.grantReadData(getpropertyFunction);
    propertyTable.grantReadWriteData(updatepropertyFunction);
    propertyTable.grantReadWriteData(deletepropertyFunction);

    // Create IAM Role for API Gateway
    const apiGatewayRole = new iam.Role(this, 'ApiGatewayRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    });

    // Attach policies to the role
    apiGatewayRole.addToPolicy(new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      resources: [createpropertyFunction.functionArn, getpropertyFunction.functionArn, updatepropertyFunction.functionArn, deletepropertyFunction.functionArn],
    }));

    // API Gateway for property Service
    const api = new apigateway.RestApi(this, 'propertyApi', {
      restApiName: `propertyService-${stage}`,
      description: 'This service handles property operations for the Airbnb clone.',
    });

    // API Gateway Integration with Lambda
    const createpropertyIntegration = new apigateway.LambdaIntegration(createpropertyFunction);

    const propertyApiResource = api.root.addResource('property');
    propertyApiResource.addMethod('POST', createpropertyIntegration); // POST /property

    const getpropertyIntegration = new apigateway.LambdaIntegration(getpropertyFunction);
    const updatepropertyIntegration = new apigateway.LambdaIntegration(updatepropertyFunction);
    const deletepropertyIntegration = new apigateway.LambdaIntegration(deletepropertyFunction);

    const propertyIdResouce = propertyApiResource.addResource('{propertyId}')
    propertyIdResouce.addMethod('GET', getpropertyIntegration); // GET /property/{propertyId}
    propertyIdResouce.addMethod('PUT', updatepropertyIntegration); // PUT /property/{propertyId}
    propertyIdResouce.addMethod('DELETE', deletepropertyIntegration); // DELETE /property/{propertyId}

    // Outputs
    new cdk.CfnOutput(this, 'propertyApiUrl', {
      value: api.url,
      description: 'The URL of the property API Gateway',
    });
  }
}

const app = new cdk.App();
new PropertyServiceStack(app, 'PropertyServiceStack', {
  stage: 'dev',  // Replace with your stage value
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
}, 
});
