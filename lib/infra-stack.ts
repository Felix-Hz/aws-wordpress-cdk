import { config } from "./config";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";

import {
  s3Bucket,
  customVpc,
  wpServerEC2,
  wpServerASG,
  wpFileSystem,
  auroraCluster,
  loadBalancerSG,
  wpAppLoadBalancer,
  autoScalingGroupSG,
  bastionScalingGroupSG,
} from "./constructs";

/* ====================================================== *
 *                     @TO-DO LIST                        *
 * ====================================================== *
 * - Mount Elastic File System to the servers.            |
 * ====================================================== */

export class WpInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* ============================================= *
     * PROVISIONING STACK FOR WORDPRESS APPLICATION. *
     * ============================================= */

    const vpc = new customVpc(this, `${config.projectName}-VPC`);

    const securityGroupBastion = new bastionScalingGroupSG(
      this,
      `${config.projectName}-SG-BH`,
      vpc.vpc
    );

    const securityGroupASG = new autoScalingGroupSG(
      this,
      `${config.projectName}-SG-ASG`,
      vpc.vpc
    );

    const securityGroupELB = new loadBalancerSG(
      this,
      `${config.projectName}-SG-ELB`,
      vpc.vpc
    );

    const sslCertificate = certificatemanager.Certificate.fromCertificateArn(
      this,
      `${config.projectName}-SSL`,
      `${config.resources.sslCertificateArn}`
    );

    const bastionHostEc2 = new wpServerEC2(
      this,
      `${config.projectName}-BH-EC2`,
      vpc.vpc,
      securityGroupBastion.ec2SecurityGroup
    );

    const db = new auroraCluster(this, `${config.projectName}-DB`, vpc.vpc);

    // const wpElasticFileSys = new wpFileSystem(this,`${config.projectName}-EFS`, vpc.vpc);

    const autoScalingGroupEC2 = new wpServerASG(
      this,
      `${config.projectName}-ASG`,
      vpc.vpc,
      securityGroupASG.ec2SecurityGroup
      // db.rdsInstance
      // wpElasticFileSys.fileSystem
    );

    db.auroraCluster.connections.allowDefaultPortFrom(autoScalingGroupEC2.asg);

    const appLoadBalancer = new wpAppLoadBalancer(
      this,
      `${config.projectName}-ALB`,
      autoScalingGroupEC2.asg,
      vpc.vpc,
      securityGroupELB.ec2SecurityGroup,
      sslCertificate
    );

    const s3 = new s3Bucket(this, `${config.projectName}-S3`);
    s3.s3Bucket.grantReadWrite(autoScalingGroupEC2.asg);
  }
}
