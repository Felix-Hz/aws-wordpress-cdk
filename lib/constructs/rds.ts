import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

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

    const dbCredentialsSecret = new secretsmanager.Secret(
      this,
      "WpAdminSecret",
      {
        secretName: "wp-db-user",
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: "admin",
          }),
          generateStringKey: "password",
          passwordLength: 16,
          excludePunctuation: true,
        },
      }
    );

    this.rdsInstance = new rds.DatabaseInstance(this, "WpDatabase", {
      databaseName: "wordpress_db",
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
      // @TODO: Change for an Aurora MySQL
      engine: rds.DatabaseInstanceEngine.MYSQL,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      // This will destroy the data on stack deletion. Replace with SNAPSHOT
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      storageEncrypted: true,
      // deletionProtection: true,
      // backupRetention: cdk.Duration.days(7),
    });
  }
}
