import { config } from "./config";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import {
  s3Bucket,
  customSG,
  customVpc,
  rdsInstance,
  wpServerASG,
  wpFileSystem,
  wpAppLoadBalancer,
  // wpServerEC2,
} from "./constructs";

export class WpInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* @TODO:
     * - Architecture diagram
     * - HTTPS/SSL certificate
     * - S3 with CDN for heavy media assets
     */

    /* ============================================= *
     * PROVISIONING STACK FOR WORDPRESS APPLICATION. *
     * ============================================= */

    // const ec2 = new wpServerEC2(this, `${config.projectName}-EC2`, vpc.vpc, securityGroup.ec2SecurityGroup);

    const vpc = new customVpc(this, `${config.projectName}-VPC`);

    const securityGroup = new customSG(
      this,
      `${config.projectName}-SG`,
      vpc.vpc
    );

    const db = new rdsInstance(this, `${config.projectName}-DB`, vpc.vpc);

    // const wpElasticFileSys = new wpFileSystem(this,`${config.projectName}-EFS`, vpc.vpc);

    const autoScalingGroupEC2 = new wpServerASG(
      this,
      `${config.projectName}-ASG`,
      vpc.vpc,
      securityGroup.ec2SecurityGroup,
      db.rdsInstance,
      // wpElasticFileSys.fileSystem
    );
    db.rdsInstance.connections.allowDefaultPortFrom(autoScalingGroupEC2.asg);

    const appLoadBalancer = new wpAppLoadBalancer(
      this,
      `${config.projectName}-ALB`,
      autoScalingGroupEC2.asg,
      vpc.vpc
    );

    const s3 = new s3Bucket(this, `${config.projectName}-S3`);
    s3.s3Bucket.grantReadWrite(autoScalingGroupEC2.asg);
  }
}
