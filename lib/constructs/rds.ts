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
      /*  ========================
            FOR PRODUCTION LOADS
       *  ========================
       * - ENGINE: Aurora MySQL for vertical scaling
       * - INSTANCE TYPE: m5.large ,
       * - MULTI-AZ:true
       * - DELETION PROTECTION: true
       * - BACKUP-RETENTION: 14 days
       * - REMOVAL POLICY: Snapshot
       */
      databaseName: "wordpress_db",
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
      engine: rds.DatabaseInstanceEngine.MYSQL,
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      storageEncrypted: true,
    });

    /*==================================================
            MASTER-READ REPLICA OPTIMIZATION 
      ================================================== 
      const masterInstance = this.rdsInstance;
      const dbReadReplica = new rds.DatabaseInstanceReadReplica(this,"replicaWpDatabase", {sourceDatabaseInstance: masterInstance, vpc, instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),});
    */
  }
}
