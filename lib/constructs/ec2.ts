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
    const keyPairName = "aws-wordpress-cdk";
    const keyPairRef = new ec2.KeyPair(this, keyPairName);

    // @TODO: Add ASG.
    this.ec2Instance = new ec2.Instance(this, "WpServer", {
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

    /* ============================================= *
     *    SERVER PROVISIONING & WORDPRESS SETUP.     *
     * ============================================= */

    this.ec2Instance.addUserData(
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
