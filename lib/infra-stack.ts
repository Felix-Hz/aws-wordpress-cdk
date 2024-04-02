import { config } from "./config";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import {
  s3Bucket,
  customVpc,
  wpServerASG,
  wpFileSystem,
  auroraCluster,
  loadBalancerSG,
  // wpServerEC2,
  wpAppLoadBalancer,
  autoScalingGroupSG,
} from "./constructs";

/* ====================================================== *
 *                     @TO-DO LIST                        *
 * ====================================================== *
 * - CloudFront in front of the application load balancer.
 * - Spin ASG from AMI template.
 * - S3 with CDN for heavy media assets.
 * - Mount Elastic File System to the servers.
 * - HTTPS/SSL certificate.
 * - Route 53 setup for domain.
 * ====================================================== */

export class WpInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /* ============================================= *
     * PROVISIONING STACK FOR WORDPRESS APPLICATION. *
     * ============================================= */

    const vpc = new customVpc(this, `${config.projectName}-VPC`);

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
      securityGroupELB.ec2SecurityGroup
    );

    const s3 = new s3Bucket(this, `${config.projectName}-S3`);
    s3.s3Bucket.grantReadWrite(autoScalingGroupEC2.asg);
  }
}
