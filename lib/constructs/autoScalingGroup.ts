import { Construct } from "constructs";
import * as ec2 from "aws-cdk-lib/aws-ec2";
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
    securityGroup: ec2.ISecurityGroup
  ) {
    super(scope, id);

    // Create KeyPair to SSH into the machine.
    const keyPairName = "aws-wordpress-cdk";
    const keyPairRef = new ec2.KeyPair(this, keyPairName);

    this.asg = new autoscaling.AutoScalingGroup(this, "WpServerASG", {
      autoScalingGroupName: "WpServerASG",
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
      minCapacity: 2,
      desiredCapacity: 2,
      maxCapacity: 4,
    });

    /* ============================================= *
     *    SERVER PROVISIONING & WORDPRESS SETUP.     *
     * ============================================= */

    this.asg.addUserData(
      "sudo yum check-update -y && sudo yum upgrade -y",
      "sudo yum install -y httpd gcc-c++ zlib-devel",
      "sudo amazon-linux-extras enable php8.2 && sudo yum clean metadata",
      "sudo yum install php php-cli php-pdo php-fpm php-json php-mysqlnd",
      "sudo systemctl start httpd && sudo systemctl enable httpd",
      "cd /var/www/html && sudo wget https://wordpress.org/latest.tar.gz",
      "sudo tar -xzvf latest.tar.gz && sudo mv wordpress/* .",
      "sudo chown -R apache:apache /var/www/html",
      "sudo rm latest.tar.gz && sudo rmdir wordpress"
    );
  }
}
