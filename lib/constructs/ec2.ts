import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

///////
//   ____________
//   / __/ ___/_  |
//  / _// /__/ __/
// /___/\___/____/
//
///////

export class wpServerEC2 extends Construct {
  public readonly ec2Instance: ec2.Instance;

  constructor(
    scope: Construct,
    id: string,
    vpc: ec2.IVpc,
    securityGroup: ec2.ISecurityGroup
  ) {
    super(scope, id);

    // @NOTE: KeyPair created manually.
    const keyPairName = "wordpress-asg-bastion";
    const keyPairRef = ec2.KeyPair.fromKeyPairName(
      this,
      `${keyPairName}-ref`,
      keyPairName
    );

    /* ===================== *
     *    BASTION CONFIG     *
     *====================== */

    const instanceType = ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.MICRO
    );

    const machineImage = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    });

    this.ec2Instance = new ec2.Instance(this, "WpBastionHost", {
      vpc: vpc,
      instanceType,
      machineImage,
      securityGroup: securityGroup,
      keyName: keyPairRef.keyPairName,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    this.ec2Instance.addUserData("yum update -y");
  }
}
