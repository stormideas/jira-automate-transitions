import { affectedIssues, getCiContext } from "./github-context";
import { loadConfig } from "./load-config";
import * as Core from "@actions/core";
import "console";
import { syncIssue } from "./sync-issue";

async function run() {
  const configPath = Core.getInput("configPath", {
    required: true,
    trimWhitespace: true,
  });
  let jiraToken = Core.getInput("jiraToken", {
    required: false,
    trimWhitespace: true,
  });
  if (jiraToken.length == 0) {
    jiraToken = undefined;
  }

  let githubToken = Core.getInput("githubToken", {
    required: false,
    trimWhitespace: true,
  });
  if (githubToken.length == 0) {
    githubToken = undefined;
  }

  const config = await loadConfig(configPath);

  // Set GitHub token from input or config
  if (githubToken && (!config.github || !config.github.token)) {
    if (!config.github) {
      config.github = { token: githubToken };
    } else {
      config.github.token = githubToken;
    }
  }

  const ciCtx = getCiContext();
  console.log("GitubContext:");
  console.log(JSON.stringify(ciCtx, null, 4));

  const issuesAffected = affectedIssues(ciCtx, config.issueKeyRegExp);
  console.log("AFFECTED issues");
  for (const key of issuesAffected) {
    console.log(` ${key}`);
    syncIssue(key, ciCtx, config, jiraToken);
  }
}

run();
