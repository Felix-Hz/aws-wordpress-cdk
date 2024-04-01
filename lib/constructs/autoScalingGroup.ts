import * as dotenv from "dotenv";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as efs from "aws-cdk-lib/aws-efs";
import * as autoscaling from "aws-cdk-lib/aws-autoscaling";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

dotenv.config();

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
    // dbInstance: rds.DatabaseInstance
    // efsFileSystem: efs.FileSystem
  ) {
    super(scope, id);

    // Create KeyPair to SSH into the machine.
    const keyPairName = "aws-wordpress-cdk";
    const keyPairRef = new ec2.KeyPair(this, keyPairName);

    /* ===================== *
     *    IAM SERVER ROLE    *
     *====================== */

    const ec2Role = new iam.Role(this, "wpEC2Role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    const secretAccessPolicy = new iam.Policy(this, "SecretAccessPolicy", {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ["secretsmanager:GetSecretValue", "ec2:DescribeImages"],
          resources: ["*"],
        }),
      ],
    });

    ec2Role.attachInlinePolicy(secretAccessPolicy);

    /* ===================== *
     *    WORDPRESS SETUP    *
     *====================== */

    const userData = ec2.UserData.forLinux();
    // userData.addCommands("sudo yum install -y amazon-efs-utils", `sudo mkdir -p /mnt/efs`, `sudo mount -t efs ${efsFileSystem.fileSystemId}:/uploads /var/www/html/wp-content/uploads`);
    const dbCredentialsSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "WpAdminSecret",
      "wp-db-user"
    );

    userData.addCommands(
      "sudo yum check-update -y && sudo yum upgrade -y",
      "sudo yum install -y httpd gcc-c++ zlib-devel",
      "sudo amazon-linux-extras enable php8.2",
      "sudo yum clean metadata",
      "sudo yum install php php-cli php-pdo php-fpm php-json php-mysqlnd",
      "sudo systemctl enable httpd",
      "cd /var/www/html && sudo wget https://wordpress.org/latest.tar.gz",
      "sudo tar -xzvf latest.tar.gz && sudo mv wordpress/* .",
      "sudo chown -R apache:apache /var/www/html",
      "sudo rm latest.tar.gz && sudo rmdir wordpress",
      'echo "<h1>Hello World from $(hostname -f)</h1>" > /var/www/html/index.html',
      "sudo systemctl start httpd"
    );

    /* ====================== *
     *   SERVER PROVISIONING  *
     * ====================== */

    const machineImage = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    });

    const instanceType = ec2.InstanceType.of(
      ec2.InstanceClass.T2,
      ec2.InstanceSize.MICRO
    );

    // @TODO: Spin ASG from custom AMI.
    // const machineImage = ec2.MachineImage.genericLinux({[AMI_REGION]: AMI_ID,});

    this.asg = new autoscaling.AutoScalingGroup(this, "WpServerASG", {
      vpc: vpc,
      machineImage,
      instanceType,
      role: ec2Role,
      minCapacity: 1,
      maxCapacity: 2,
      desiredCapacity: 1,
      userData: userData,
      securityGroup: securityGroup,
      keyName: keyPairRef.keyPairName,
      autoScalingGroupName: "WpServerASG",
      healthCheck: autoscaling.HealthCheck.ec2(),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
  }
}
