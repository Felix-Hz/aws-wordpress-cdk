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
  public readonly s3Bucket: s3.Bucket;

  /*
  *   Store media assets to be delivered as CDN. Needs to be configured with a plugin.  
  */

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.s3Bucket = new s3.Bucket(this, "WpAssetsBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
