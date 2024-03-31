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
    securityGroup: ec2.ISecurityGroup,
    dbInstance: rds.DatabaseInstance
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
          actions: ["secretsmanager:GetSecretValue"],
          resources: ["arn:aws:secretsmanager:*:*:secret:*"],
        }),
      ],
    });

    ec2Role.attachInlinePolicy(secretAccessPolicy);

    /* ===================== *
     *    WORDPRESS SETUP    *
     *====================== */

    // @TODO: Add these to the AWS Secret Manager.
    const DB_NAME = "wordpress_db";
    const AUTH_KEY = process.env.AUTH_KEY || "";
    const SECURE_AUTH_KEY = process.env.SECURE_AUTH_KEY || "";
    const LOGGED_IN_KEY = process.env.LOGGED_IN_KEY || "";
    const NONCE_KEY = process.env.NONCE_KEY || "";
    const AUTH_SALT = process.env.AUTH_SALT || "";
    const SECURE_AUTH_SALT = process.env.SECURE_AUTH_SALT || "";
    const LOGGED_IN_SALT = process.env.LOGGED_IN_SALT || "";
    const NONCE_SALT = process.env.NONCE_SALT || "";

    const userData = ec2.UserData.forLinux();
    // userData.addCommands("sudo yum install -y amazon-efs-utils", `sudo mkdir -p /mnt/efs`, `sudo mount -t efs ${efsFileSystem.fileSystemId}:/uploads /var/www/html/wp-content/uploads`);
    const dbCredentialsSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      "WpAdminSecret",
      "wp-db-user"
    );
    /*
     *  Values required for the wp-config.php file.
     */
    userData.addCommands(
      `export DB_NAME="${DB_NAME}"`,
      `export DB_USER="$(aws secretsmanager get-secret-value --secret-id ${dbCredentialsSecret.secretArn} --query 'SecretString.Username' --output text)"`,
      `export DB_PASSWORD="$(aws secretsmanager get-secret-value --secret-id ${dbCredentialsSecret.secretArn} --query 'SecretString.Password' --output text)"`,
      `export DB_HOST="${dbInstance.dbInstanceEndpointAddress}"`,
      `export AUTH_KEY="${AUTH_KEY}"`,
      `export SECURE_AUTH_KEY="${SECURE_AUTH_KEY}"`,
      `export LOGGED_IN_KEY="${LOGGED_IN_KEY}"`,
      `export NONCE_KEY="${NONCE_KEY}"`,
      `export AUTH_SALT="${AUTH_SALT}"`,
      `export SECURE_AUTH_SALT="${SECURE_AUTH_SALT}"`,
      `export LOGGED_IN_SALT="${LOGGED_IN_SALT}"`,
      `export NONCE_SALT="${NONCE_SALT}"`
    );

    /* ====================== *
     *   SERVER PROVISIONING  *
     * ====================== */

    // Use the Custom WordPress AMI.
    const wordpressCustomAMI = ec2.MachineImage.genericLinux({
      "ap-southeast-2": "ami-07990b97b8c7d4b61",
    });

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
      role: ec2Role,
      userData: userData,
    });
  }
}
