import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";

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
    vpc: ec2.IVpc
  ) {
    super(scope, id);

    this.alb = new elbv2.ApplicationLoadBalancer(this, "wpAppLoadBalancer", {
      vpc,
      internetFacing: true,
    });

    const listener = this.alb.addListener("HTTP-listener", {
      port: 80,
      open: true,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      "targetWpServerASG",
      {
        vpc,
        port: 80,
        targets: [asg],
      }
    );

    listener.addTargetGroups("TargetGroup", {
      targetGroups: [targetGroup],
    });

    // this.alb.logAccessLogs(
    //   new s3.Bucket(this, "s3loggingbucket", {
    //     bucketName: "",
    //   })
    // );
  }
}
