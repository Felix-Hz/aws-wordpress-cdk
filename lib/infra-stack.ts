import { config } from "./config";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import {
  s3Bucket,
  customSG,
  customVpc,
  wpServerEC2,
  rdsInstance,
} from "./constructs";

export class WpInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* @TODO:
     * - Architecture diagram
     * - HTTPS/SSL
     * - Stacks
     * - See if S3 as a CDN or what.
     *
     * Stacks to be implemented:
     * 1) Implement ASG
     * 2) Implement Load Balancing
     * 3) Store WordPress in an EFS
     */

    /* ============================================= *
     * PROVISIONING STACK FOR WORDPRESS APPLICATION. *
     * ============================================= */

    const vpc = new customVpc(this, `${config.projectName}-VPC`);

    const securityGroup = new customSG(
      this,
      `${config.projectName}-SG`,
      vpc.vpc
    );

    const ec2 = new wpServerEC2(
      this,
      `${config.projectName}-EC2`,
      vpc.vpc,
      securityGroup.ec2SecurityGroup
    );

    const db = new rdsInstance(this, `${config.projectName}-DB`, vpc.vpc);

    const s3 = new s3Bucket(this, `${config.projectName}-S3`);

    /* ============================== *
     * SETTING NECESSARY PERMISSIONS. *
     * ============================== */

    db.rdsInstance.connections.allowDefaultPortFrom(ec2.ec2Instance);
    s3.s3Bucket.grantReadWrite(ec2.ec2Instance);
  }
}
