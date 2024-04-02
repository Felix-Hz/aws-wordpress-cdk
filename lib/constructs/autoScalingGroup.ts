import * as dotenv from "dotenv";
import * as cdk from "aws-cdk-lib";
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

    // userData.addCommands("sudo yum install -y amazon-efs-utils", `sudo mkdir -p /mnt/efs`, `sudo mount -t efs ${efsFileSystem.fileSystemId}:/uploads /var/www/html/wp-content/uploads`);
    // const dbCredentialsSecret = secretsmanager.Secret.fromSecretNameV2(this,"WpAdminSecret","wp-db-user");

    const userData = ec2.UserData.forLinux();

    userData.addCommands(
      "sudo yum check-update -y && sudo yum upgrade -y",
      "sudo yum install -y httpd gcc-c++ zlib-devel",
      "sudo amazon-linux-extras enable php8.2",
      "sudo yum clean metadata",
      "sudo yum install php php-cli php-pdo php-fpm php-json php-mysqlnd",
      "sudo systemctl enable httpd",
      "cd /var/www/html && sudo wget https://wordpress.org/latest.tar.gz",
      "sudo tar -xzvf latest.tar.gz",
      "sudo mv wordpress/* .",
      "sudo chown -R apache:apache /var/www/html",
      "sudo rm latest.tar.gz",
      "sudo rmdir wordpress",
      'echo "<h1>Hello World from $(hostname -f)</h1>" > /var/www/html/index.html',
      "sudo systemctl start httpd"
    );

    /* ====================== *
     *   SERVER PROVISIONING  *
     * ====================== */

    const REGION = process.env.REGION || "ap-southeast-2";
    const AMI_ID = process.env.AMI_ID || "ami-03a4ba9dba0b6d470";

    const machineImage = ec2.MachineImage.genericLinux({ [REGION]: AMI_ID });

    // @NOTE: If you don't have the custom template, create a new instance to set it up.
    // const machineImage = new ec2.AmazonLinuxImage({generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,});

    const instanceType = ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.MEDIUM
    );

    this.asg = new autoscaling.AutoScalingGroup(this, "WpServerASG", {
      /*  ========================
            FOR PRODUCTION LOADS
       *  ========================
       * - INSTANCE: t3.medium or large depending on the requirements.
       * - MIN CAPACITY: 2.
       * - SUBNET: isolated, set up bastion and let the ELB access the instances. 
       */
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
      // @TODO: Change to private subnet and expose only the load balancer.
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceMonitoring: autoscaling.Monitoring.DETAILED,
    });

    this.asg.scaleOnCpuUtilization("scaleOutCpu", {
      // Scale out/in when CPU utilization exceeds 70%.
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });
  }
}
