import * as dotenv from "dotenv";

dotenv.config();

const stage = process.env.STAGE || "dev";

export const config = {
  projectName: `wordpressApp-${stage}`,
  stage,
  deployedBy: `${process.env.DEPLOYED_BY || process.env.USER}`,
};
