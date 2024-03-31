import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { config } from "../lib/config";
import { WpInfraStack } from "../lib/infra-stack";

const app = new cdk.App({
  context: {
    // Sydney as main region.
    region: "ap-southeast-2",
  },
});

new WpInfraStack(app, `wordpressApp-${config.stage}`, {
  description:
    "Deploys and provisions infrastructure for a WordPress application",
  tags: { Project: config.projectName, DeployedBy: config.deployedBy },
});
