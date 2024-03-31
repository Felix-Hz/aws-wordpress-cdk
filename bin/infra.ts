import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { config } from "../lib/config";
import { WpInfraStack } from "../lib/infra-stack";

const app = new cdk.App();

new WpInfraStack(app, `wordpressApp-${config.stage}`, {
  env: {
    account: config.aws_account.account_no,
    region: config.aws_account.region,
  },
  description:
    "Deploys and provisions infrastructure for a WordPress application",
  tags: { Project: config.projectName, DeployedBy: config.deployedBy },
});
