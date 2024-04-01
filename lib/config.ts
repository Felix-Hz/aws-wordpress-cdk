import * as dotenv from "dotenv";

dotenv.config();

// @BUG: On cdk synth, process.env vars are undefined.
const region = process.env.REGION || "";
const stage = process.env.STAGE || "dev";
const accountNo = process.env.ACCOUNT || "";
const deployedBy = `${process.env.DEPLOYED_BY || process.env.USER}`;

export const config = {
  stage,
  aws_account: {
    region: region,
    account_no: accountNo,
  },
  deployedBy: deployedBy,
  projectName: `wordpressApp-${stage}`,
};
