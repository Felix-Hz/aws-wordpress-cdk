import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";

///////
//    ___  ___  ____  ___  ___
//   / _ \/ _ \/ __/ / _ \/ _ )
//  / , _/ // /\ \  / // / _  |
// /_/|_/____/___/ /____/____(_)
//
///////

export class rdsInstance extends Construct {
  public readonly rdsInstance: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, vpc: ec2.IVpc) {
    super(scope, id);

    this.rdsInstance = new rds.DatabaseInstance(this, "WpDatabase", {
      databaseName: "wordpress_db",
      // @TODO: Change for an Aurora MySQL
      engine: rds.DatabaseInstanceEngine.MYSQL,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      // This will destroy the data on stack deletion. Replace with SNAPSHOT
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // deletionProtection: true,
      // backupRetention: cdk.Duration.days(7),
    });
  }
}
