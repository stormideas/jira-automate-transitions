import { config } from "dotenv";
config();
import { handleTransitionIssue } from "../handlers";
import { JiraClient } from "../jira";
import { info } from "console";
import { parseString } from "../get-args"

const {
  JIRA_API_ENDPOINT,
  JIRA_ISSUE_KEY,
  JIRA_AUTH_TOKEN,
  JIRA_ACCOUNT,
  JIRA_REVIEW_ID,
  JIRA_IN_PROGRESS_ID
} = process.env;

const jiraToken = Buffer.from(`${JIRA_ACCOUNT}:${JIRA_AUTH_TOKEN}`).toString(
  "base64"
);

(async () => {
  let x = 10, y = 10;

  switch (x - y) {
    case 0: {
      console.log("Result: 0");
      // break;
    }
    case 5:
      console.log("Result: 5");
      // break;
    case 10:
      console.log("Result: 10");
      break;
    default:
      console.log('da')
  }
})();
