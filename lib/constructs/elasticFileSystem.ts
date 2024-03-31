import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as efs from "aws-cdk-lib/aws-efs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

export class wpFileSystem extends cdk.Stack {
  public readonly fileSystem: efs.FileSystem;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);

    this.fileSystem = new efs.FileSystem(this, "wpFileSystem", {
      vpc: vpc,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_7_DAYS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
