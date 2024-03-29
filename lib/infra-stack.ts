import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
// import * as elb from "aws-cdk-lib/aws-elasticloadbalancingv2";
// import * as cloudfront from "aws-cdk-lib/aws-cloudfront";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // @TODO:
    // - Architecture diagram
    // - SSL

    ///////
    // _   _____  _____
    // | | / / _ \/ ___/
    // | |/ / ___/ /__
    // |___/_/   \___/
    //
    ///////

    const vpc = new ec2.Vpc(this, "WpNetwork", {
      // 2 AZs for High Availability
      maxAzs: 2,
      subnetConfiguration: [
        {
          subnetType: ec2.SubnetType.PUBLIC,
          name: "WpPublicSubnet",
          cidrMask: 24,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          name: "WpPrivateSubnet",
          cidrMask: 24,
        },
      ],
    });

    ///////
    //   _____________    ________  ____  __  _____
    //   / __/ __/ ___/   / ___/ _ \/ __ \/ / / / _ \
    //  _\ \/ _// /___   / (_ / , _/ /_/ / /_/ / ___/
    // /___/___/\___(_)  \___/_/|_|\____/\____/_/
    //
    ///////

    const ec2SecurityGroup = new ec2.SecurityGroup(this, "WpSecGroup", {
      vpc: vpc,
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      "SSH access"
    );
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      "HTTP access"
    );
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      "HTTPS access"
    );

    ///////
    //   ____________
    //   / __/ ___/_  |
    //  / _// /__/ __/
    // /___/\___/____/
    //
    ///////

    const keyPairName = "aws-wordpress-cdk";
    const keyPairRef = ec2.KeyPair.fromKeyPairName(
      this,
      "ssh-access-keypair",
      keyPairName
    );

    const ec2Instance = new ec2.Instance(this, "WpServer", {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      securityGroup: ec2SecurityGroup,
      keyPair: keyPairRef,
      // detailedMonitoring: true,
      // ssmSessionPermissions: true,
    });

    // Update packages, and install necessary utils
    ec2Instance.userData.addCommands(
      "sudo yum check-update -y && sudo yum upgrade -y",
      "sudo yum install -y httpd gcc-c++ zlib-devel",
      "sudo amazon-linux-extras enable php8.2 && sudo yum clean metadata",
      "sudo yum install php php-cli php-pdo php-fpm php-json php-mysqlnd",
      // Start Apache web server, and ensure it starts on boot
      "sudo systemctl start httpd && sudo systemctl enable httpd",
      // WordPress setup
      "cd /var/www/html && sudo wget https://wordpress.org/latest.tar.gz",
      "sudo tar -xzvf latest.tar.gz && sudo mv wordpress/* .",
      "sudo chown -R apache:apache /var/www/html",
      "sudo rm latest.tar.gz && sudo rmdir wordpress"
    );

    ///////
    //    ___  ___  ____  ___  ___
    //   / _ \/ _ \/ __/ / _ \/ _ )
    //  / , _/ // /\ \  / // / _  |
    // /_/|_/____/___/ /____/____(_)
    //
    ///////

    // CDK Automatically creates root credentials with randomly generated secure safe password.
    const dbInstance = new rds.DatabaseInstance(this, "WpDatabase", {
      databaseName: "wordpress_db",
      engine: rds.DatabaseInstanceEngine.MYSQL,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      // This will destroy the data on stack deletion.
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    dbInstance.connections.allowDefaultPortFrom(ec2Instance);

    ///////
    //    ________
    //    / __/_  /
    //   _\ \_/_ <
    //  /___/____/
    //
    ///////

    const s3Bucket = new s3.Bucket(this, "WpAssetsBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    s3Bucket.grantReadWrite(ec2Instance);
  }
}

//////////////////////////////////////////////////////////////////////

// // CloudFront distribution for content delivery
// const cloudFrontDistribution = new cloudfront.CloudFrontWebDistribution(
//   this,
//   "CDNDistribution",
//   {
//     originConfigs: [
//       {
//         s3OriginSource: {
//           s3BucketSource: s3Bucket,
//         },
//         behaviors: [{ isDefaultBehavior: true }],
//       },
//     ],
//   }
// );

// // Elastic Load Balancer
// const loadBalancer = new elb.ApplicationLoadBalancer(this, "LoadBalancer", {
//   vpc: vpc,
//   internetFacing: true,
// });

// // Listener for Load Balancer
// const listener = loadBalancer.addListener("Listener", { port: 80 });

// // Target Group for Load Balancer
// const targetGroup = new elb.ApplicationTargetGroup(this, "TargetGroup", {
//   vpc: vpc,
//   port: 80,
//   targetType: elb.TargetType.INSTANCE,
//   targets: [ec2Instance],
// });

// // Add Target Group to Listener
// listener.addTargetGroups("DefaultTargetGroup", {
//   targetGroups: [targetGroup],
// });