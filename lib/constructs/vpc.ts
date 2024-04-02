import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

///////
// _   _____  _____
// | | / / _ \/ ___/
// | |/ / ___/ /__
// |___/_/   \___/
//
///////

export class customVpc extends Construct {
  public readonly vpc: ec2.IVpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, `WpNetwork`, {
      // 2 AZs for High Availability
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: "WpPublicSubnet",
          cidrMask: 24,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          name: "WpPrivateSubnet",
          cidrMask: 24,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          name: "WpEgressPrivateSubnet",
          cidrMask: 24,
        },
      ],
    });
  }
}
