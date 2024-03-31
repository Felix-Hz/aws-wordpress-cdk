import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as efs from "aws-cdk-lib/aws-efs";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";

///////
// ___  __  ____________      ____________   __   ____    _____
// / _ |/ / / /_  __/ __ \____/ __/ ___/ _ | / /  / __/___/ ___/
// / __ / /_/ / / / / /_/ /___/\ \/ /__/ __ |/ /__/ _//___/ (_ /
// /_/ |_\____/ /_/  \____/   /___/\___/_/ |_/____/___/    \___/
//
///////

export class wpServerASG extends Construct {
  public readonly asg: autoscaling.AutoScalingGroup;

  constructor(
    scope: Construct,
    id: string,
    vpc: ec2.IVpc,
    securityGroup: ec2.ISecurityGroup,
    efsFileSystem: efs.FileSystem
  ) {
    super(scope, id);

    // @TODO: Launch from customized template. Read secret manager for credentials, and inject them via userData.

    // Create KeyPair to SSH into the machine.
    const keyPairName = "aws-wordpress-cdk";
    const keyPairRef = new ec2.KeyPair(this, keyPairName);

    // Use the Custom WordPress AMI.
    const wordpressCustomAMI = ec2.MachineImage.genericLinux({
      "ap-southeast-2": "ami-07990b97b8c7d4b61",
    });

    /* ============================================= *
     *    SERVER PROVISIONING & WORDPRESS SETUP.     *
     * ============================================= */

    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      "yum install -y amazon-efs-utils",
      `mkdir -p /mnt/efs`,
      `mount -t efs ${efsFileSystem.fileSystemId}:/uploads /var/www/html/wp-content/uploads`
    );

    this.asg = new autoscaling.AutoScalingGroup(this, "WpServerASG", {
      autoScalingGroupName: "WpServerASG",
      machineImage: wordpressCustomAMI,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T2,
        ec2.InstanceSize.MICRO
      ),
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: securityGroup,
      keyName: keyPairRef.keyPairName,
      minCapacity: 2,
      desiredCapacity: 2,
      maxCapacity: 4,
      userData: userData,
    });
  }
}
