import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

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

    // Create KeyPair to SSH into the machine.
    const keyPairName = "aws-bastion-wordpress-cdk";
    const keyPairRef = new ec2.KeyPair(this, keyPairName);

    this.ec2Instance = new ec2.Instance(this, "WpBastionHost", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: securityGroup,
      keyName: keyPairRef.keyPairName,
      detailedMonitoring: true,
    });

    this.ec2Instance.addUserData("yum update -y");
  }
}
