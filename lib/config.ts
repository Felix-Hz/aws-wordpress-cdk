import * as dotenv from "dotenv";

dotenv.config();

// @BUG: On cdk synth, process.env vars are undefined.
const region = process.env.REGION || "";
const stage = process.env.STAGE || "dev";
const accountNo = process.env.ACCOUNT || "";
const deployedBy = `${process.env.DEPLOYED_BY || process.env.USER}`;
const customAMI = process.env.AMI_ID || "";
const sslArn = process.env.SSL_ARN || "";

export const config = {
  stage,
  resources: {
    customWpAMI: customAMI,
    sslCertificateArn: sslArn,
  },
  aws_account: {
    region: region,
    account_no: accountNo,
  },
  deployedBy: deployedBy,
  projectName: `wordpressApp-${stage}`,
};
