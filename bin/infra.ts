import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { config } from "../lib/config";
import { WpInfraStack } from "../lib/infra-stack";

const app = new cdk.App();
new WpInfraStack(app, `wordpressApp-${config.stage}`, {
  description:
    "Deploys and provisions infrastructure for a WordPress application",
  tags: { Project: config.projectName, DeployedBy: config.deployedBy },
});
