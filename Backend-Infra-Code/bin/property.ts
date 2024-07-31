#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PropertyServiceStack } from '../cdk-stack/property-stack';
import { BookingServiceStack } from '../cdk-stack/Booking-stack';



const app = new cdk.App();
const stage = "DEV"
new PropertyServiceStack(app, 'PropertyServiceStack', { stage });
new BookingServiceStack(app,'BookingServiceStack',{stage});




