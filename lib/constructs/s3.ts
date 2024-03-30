import * as s3 from "aws-cdk-lib/aws-s3";
import * as cdk from "aws-cdk-lib";

import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

///////
//    ________
//    / __/_  /
//   _\ \_/_ <
//  /___/____/
//
///////

export class s3Bucket extends Construct {
  // Define a property to hold the S3 bucket object
  public readonly s3Bucket: s3.Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create S3 bucket
    this.s3Bucket = new s3.Bucket(this, "WpAssetsBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
