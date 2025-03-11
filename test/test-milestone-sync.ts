import { loadConfig } from "../src/load-config";
import { CiContext } from "../src/github-context";
import * as dotenv from "dotenv";
import * as path from "path";
import * as github from "@actions/github";

// Use require for jira-client to avoid TypeScript issues
const JiraApi = require("jira-client");

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

/**
 * Test script to validate JIRA API integration and GitHub milestone synchronization
 * 
 * Required environment variables in .env file:
 * - JIRA_API_TOKEN: API token for JIRA
 * - GITHUB_TOKEN: GitHub token for API operations
 * - TEST_ISSUE_KEY: JIRA issue key to test with (e.g., "ST-1234")
 * - TEST_REPO_OWNER: GitHub repository owner (e.g., "your-org")
 * - TEST_REPO_NAME: GitHub repository name (e.g., "your-repo")
 */
async function runTest() {
  try {
    // Get environment variables
    const jiraToken = process.env.JIRA_API_TOKEN;
    const githubToken = process.env.GITHUB_TOKEN;
    const issueKey = process.env.TEST_ISSUE_KEY;
    const repoOwner = process.env.TEST_REPO_OWNER;
    const repoName = process.env.TEST_REPO_NAME;
    const configPath = process.env.TEST_CONFIG_PATH || path.resolve(__dirname, "./test-config.yml");

    // Validate required environment variables
    if (!jiraToken) {
      throw new Error("JIRA_API_TOKEN environment variable is required");
    }

    if (!githubToken) {
      throw new Error("GITHUB_TOKEN environment variable is required");
    }

    if (!issueKey) {
      throw new Error("TEST_ISSUE_KEY environment variable is required");
    }

    if (!repoOwner || !repoName) {
      throw new Error("TEST_REPO_OWNER and TEST_REPO_NAME environment variables are required");
    }

    console.log(`Testing with issue key: ${issueKey}`);
    console.log(`Using config file: ${configPath}`);
    console.log(`GitHub repository: ${repoOwner}/${repoName}`);

    // Load config
    const config = await loadConfig(configPath);
    
    // Step 1: Connect to JIRA and get issue details
    console.log("\n--- Step 1: Connecting to JIRA and fetching issue details ---");
    
    const jiraOptions = {
      protocol: "https",
      apiVersion: "2",
      host: config.connection.host,
      username: config.connection.username,
      password: config.connection.password ?? jiraToken,
      strictSSL: true
    };
    
    console.log(`Connecting to JIRA host: ${jiraOptions.host}`);
    const jira = new JiraApi(jiraOptions);
    
    console.log(`Fetching issue: ${issueKey}`);
    const issueData = await jira.getIssue(issueKey, ["status", "fixVersions", "summary"]);
    
    console.log(`Issue found: ${issueData.key} - ${issueData.fields.summary}`);
    console.log(`Current status: ${issueData.fields.status.name}`);
    
    // Step 2: Check for fix versions
    console.log("\n--- Step 2: Checking for fix versions ---");
    
    const fixVersions = issueData.fields.fixVersions || [];
    if (fixVersions.length === 0) {
      console.log("No fix versions found for this issue. Please add a fix version in JIRA and try again.");
      return;
    }
    
    const jiraRelease = fixVersions[0];
    console.log(`Found JIRA release: ${jiraRelease.name} with date: ${jiraRelease.releaseDate || 'No date'}`);
    
    // Step 3: Connect to GitHub and check for milestone
    console.log("\n--- Step 3: Connecting to GitHub and checking for milestone ---");
    
    const octokit = new github.GitHub(githubToken);
    
    console.log(`Checking for milestone: ${jiraRelease.name}`);
    const milestones = await octokit.issues.listMilestonesForRepo({
      owner: repoOwner,
      repo: repoName,
      state: 'all'
    });
    
    let milestone = milestones.data.find(m => m.title === jiraRelease.name);
    
    if (milestone) {
      console.log(`Milestone found: ${milestone.title} (${milestone.number})`);
      console.log(`Due date: ${milestone.due_on || 'No due date'}`);
      console.log(`Open issues: ${milestone.open_issues}`);
      console.log(`Closed issues: ${milestone.closed_issues}`);
    } else {
      console.log(`Milestone not found. Would create new milestone: ${jiraRelease.name}`);
      
      // Uncomment to actually create the milestone
      /*
      const milestoneData = {
        owner: repoOwner,
        repo: repoName,
        title: jiraRelease.name,
        description: `JIRA Release: ${jiraRelease.name}`,
      };
      
      if (jiraRelease.releaseDate) {
        milestoneData.due_on = `${jiraRelease.releaseDate}T00:00:00Z`;
      }
      
      const newMilestone = await octokit.issues.createMilestone(milestoneData);
      milestone = newMilestone.data;
      console.log(`Created milestone: ${milestone.title} (${milestone.number})`);
      */
    }
    
    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Run the test
runTest(); 