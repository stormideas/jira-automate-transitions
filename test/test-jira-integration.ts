import { loadConfig } from "../src/load-config";
import { syncIssue } from "../src/sync-issue";
import { CiContext } from "../src/github-context";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Test script to validate JIRA API integration and milestone synchronization
 * 
 * Required environment variables in .env file:
 * - JIRA_API_TOKEN: API token for JIRA
 * - GITHUB_TOKEN: GitHub token for API operations
 * - TEST_ISSUE_KEY: JIRA issue key to test with (e.g., "ST-1234")
 * - TEST_CONFIG_PATH: Path to test config file (e.g., "./test-config.yml")
 */
async function runTest() {
  try {
    // Get environment variables
    const jiraToken = process.env.JIRA_API_TOKEN;
    const issueKey = process.env.TEST_ISSUE_KEY;
    const configPath = process.env.TEST_CONFIG_PATH || path.resolve(__dirname, "./test-config.yml");

    if (!jiraToken) {
      throw new Error("JIRA_API_TOKEN environment variable is required");
    }

    if (!issueKey) {
      throw new Error("TEST_ISSUE_KEY environment variable is required");
    }

    console.log(`Testing with issue key: ${issueKey}`);
    console.log(`Using config file: ${configPath}`);

    // Load config
    const config = await loadConfig(configPath);
    
    // Enable milestone synchronization for testing
    config.syncMilestones = true;

    // Create a mock CI context that simulates a GitHub pull request
    const mockCiContext: CiContext = {
      event: "pull_request",
      action: "opened",
      targetBranch: "develop",
      sourceBranch: `feature/${issueKey}-test-branch`,
      isMerged: false,
      isDraft: false,
      title: `[${issueKey}] Test PR for JIRA integration`,
      body: "This is a test PR to validate JIRA integration",
      labels: [],
      prNumber: 123, // Mock PR number
      repo: {
        owner: "test-owner",
        name: "test-repo"
      }
    };

    // Run the syncIssue function with the test issue key
    await syncIssue(issueKey, mockCiContext, config, jiraToken);
    
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Run the test
runTest(); 