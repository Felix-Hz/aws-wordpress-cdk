import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";

///////
//   _____________    ________  ____  __  _____
//   / __/ __/ ___/   / ___/ _ \/ __ \/ / / / _ \
//  _\ \/ _// /___   / (_ / , _/ /_/ / /_/ / ___/
// /___/___/\___(_)  \___/_/|_|\____/\____/_/
//
///////

export class autoScalingGroupSG extends Construct {
  public readonly ec2SecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, "WpSecGroup", {
      vpc: vpc,
      allowAllOutbound: true,
    });

    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "SSH access"
    );
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "HTTP access"
    );
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "HTTPS access"
    );
  }
}

export class loadBalancerSG extends Construct {
  public readonly ec2SecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, "WpSecGroup", {
      vpc: vpc,
      allowAllOutbound: true,
    });
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "HTTP access"
    );
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "HTTPS access"
    );
  }
}
