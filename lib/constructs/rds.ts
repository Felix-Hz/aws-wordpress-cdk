import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";

///////
// ___  __  _____  ____  ___  ___
// / _ |/ / / / _ \/ __ \/ _ \/ _ |
// / __ / /_/ / , _/ /_/ / , _/ __ |
// /_/ |_\____/_/|_|\____/_/|_/_/ |_|
//
///////

export class auroraCluster extends Construct {
  public readonly auroraCluster: rds.DatabaseCluster;

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

    const instanceType = ec2.InstanceType.of(
      ec2.InstanceClass.T3,
      ec2.InstanceSize.MEDIUM
    );

    const engine = rds.DatabaseClusterEngine.auroraMysql({
      version: rds.AuroraMysqlEngineVersion.VER_3_06_0,
    });

    this.auroraCluster = new rds.DatabaseCluster(this, "WpAuroraCluster", {
      engine,
      clusterIdentifier: "WpAuroraCluster",
      instanceProps: {
        /* ============================================================================ *
         * @NOTE: The smallest instance class that is memory optimized for AuroraMySQL  *
         *        is the db.r4.large for version 2.07.9 that seems like overkill        *
         * ============================================================================ */
        vpc,
        instanceType,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      },
      storageEncrypted: true,
      deletionProtection: true,
      defaultDatabaseName: "wordpress_db",
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
    });

    /*
      ===================================================
        RDS MYSQL INITIAL SETTINGS FOR SMALLER PROJECTS   
      ===================================================

      this.rdsInstance = new rds.DatabaseInstance(this, "WpDatabase", {
      
            databaseName: "wordpress_db",
            credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
            engine: rds.DatabaseInstanceEngine.MYSQL,
            vpc: vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
            removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
            instanceType: ec2.InstanceType.of(
              ec2.InstanceClass.T3,
              ec2.InstanceSize.MEDIUM
            ),
            storageEncrypted: true,
            deletionProtection: true,
            backupRetention: cdk.Duration.days(7),
            // multiAz: true, // Optional: Provides fault tolerance.
          });
    
      ==================================================
            MASTER-READ REPLICA OPTIMIZATION 
      ================================================== 
      const masterInstance = this.rdsInstance;
      const dbReadReplica = new rds.DatabaseInstanceReadReplica(this,"replicaWpDatabase", {sourceDatabaseInstance: masterInstance, vpc, instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),});
    */
  }
}
