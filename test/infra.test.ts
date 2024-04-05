import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { WpInfraStack } from "../lib/infra-stack";

describe("Integration test: CMS CDK Infrastructure", () => {
  let template: Template;

  /* ================================================= *
   *                  WORK IN PROGRESS                 *
   * ================================================= */

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new WpInfraStack(app, "testTemplateStack");
    template = Template.fromStack(stack);
  });

  test("VPC exists", () => {
    // @BUG: Can't grab the resources, even if it evaluates the type.
    expect(template.resourceCountIs("AWS::EC2::VPC", 1)).toBeTruthy();
  });

  // test("Security Groups exist", () => {
  //   expect(template.resourceCountIs("AWS::EC2::SecurityGroup", 3)).toBeTruthy();
  // });

  // test("Bastion Host + Server exist", () => {
  //   expect(template.resourceCountIs("AWS::EC2::Instance", 2)).toBeTruthy();
  // });

  // test("Aurora exists", () => {
  //   expect(template.resourceCountIs("AWS::RDS::DBCluster", 1)).toBeTruthy();
  // });

  // test("ELB exists", () => {
  //   expect(
  //     template.resourceCountIs("AWS::ElasticLoadBalancingV2::LoadBalancer", 1)
  //   ).toBeTruthy();
  // });

  // test("S3 exists", () => {
  //   expect(template.resourceCountIs("AWS::S3::Bucket", 1));
  // });
});
