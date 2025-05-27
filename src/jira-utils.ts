import { ConnectionCfg } from "./load-config";

// Use require for jira-client to avoid TypeScript issues
const JiraApi = require("jira-client");

/**
 * Creates a JIRA API client with the provided configuration
 * @param connectionConfig JIRA connection configuration
 * @param jiraToken Optional JIRA token to override config password
 * @returns Configured JIRA API client
 */
export function createJiraClient(connectionConfig: ConnectionCfg, jiraToken?: string) {
  const options = {
    protocol: "https",
    apiVersion: "2",
    host: connectionConfig.host,
    username: connectionConfig.username,
    password: connectionConfig.password ?? jiraToken ?? process.env.JIRA_API_TOKEN,
    strictSSL: true,
  };
  
  console.log("Jira Using connection: ");
  console.log(JSON.stringify(options, null, 2));

  return new JiraApi(options);
} 