import * as dotenv from "dotenv";

dotenv.config();

const stage = process.env.STAGE || "dev";

export const config = {
  aws_account: {
    account_no: process.env.ACCOUNT || "",
    region: process.env.REGION || "",
  },
  projectName: `wordpressApp-${stage}`,
  stage,
  deployedBy: `${process.env.DEPLOYED_BY || process.env.USER}`,
};
