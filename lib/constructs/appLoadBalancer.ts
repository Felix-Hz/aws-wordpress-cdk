import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as logs from "aws-cdk-lib/aws-logs";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager";

///////
// ___   ___  ___    __   ____  ___   ___    ___
// / _ | / _ \/ _ \  / /  / __ \/ _ | / _ \  / _ )
// / __ |/ ___/ ___/ / /__/ /_/ / __ |/ // / / _  |
// /_/ |_/_/  /_/  (_)____/\____/_/ |_/____/ /____(_)
//
///////

export class wpAppLoadBalancer extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(
    scope: Construct,
    id: string,
    asg: autoscaling.AutoScalingGroup,
    vpc: ec2.IVpc,
    customSG: ec2.ISecurityGroup,
    sslCertificate: certificatemanager.ICertificate
  ) {
    super(scope, id);

    const accessLogsELB = new s3.Bucket(this, "accessLogsELB", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.alb = new elbv2.ApplicationLoadBalancer(this, "wpAppLoadBalancer", {
      vpc,
      internetFacing: true,
      securityGroup: customSG,
    });

    // const listener = this.alb.addListener("HTTP-listener", {
    //   port: 80,
    //   open: true,
    // });

    const listener = this.alb.addListener("HTTPS-listener", {
      port: 443,
      open: true,
      certificates: [sslCertificate],
    });

    // Enforce HTTPS by redirecting HTTP requests.
    this.alb.addRedirect({
      sourceProtocol: elbv2.ApplicationProtocol.HTTP,
      sourcePort: 80,
      targetProtocol: elbv2.ApplicationProtocol.HTTPS,
      targetPort: 443,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      "targetWpServerASG",
      {
        vpc,
        port: 80,
        targets: [asg],
        healthCheck: {
          enabled: true,
          port: "traffic-port",
          protocol: elbv2.Protocol.HTTP,
          healthyHttpCodes: "200-399",
        },
      }
    );

    listener.addTargetGroups("TargetGroup", {
      targetGroups: [targetGroup],
    });

    // this.alb.logAccessLogs(accessLogsELB, "alb-access-logs/");

    const wpUnhealthyHostsELB = new cloudwatch.Alarm(
      this,
      "wpUnhealthyHostsELB",
      {
        alarmDescription:
          "Alarm if targetWpServerASG ALB has any unhealthy hosts.",
        metric: targetGroup.metrics.unhealthyHostCount(),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
  }
}
