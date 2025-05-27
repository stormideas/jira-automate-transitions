import { loadConfig } from "../src/load-config";
import { CiContext } from "../src/github-context";
import { getAllMilestones, updatePrWithMilestone } from "../src/github-utils";
import { createJiraClient } from "../src/jira-utils";
import * as dotenv from "dotenv";
import * as path from "path";
import * as github from "@actions/github";

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
 * 
 * Optional environment variables:
 * - TEST_CONFIG_PATH: Path to the config file (defaults to ./test-config.yml)
 * - TEST_PR_NUMBER: PR number to test milestone assignment (e.g., "123")
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
    
    console.log(`Connecting to JIRA host: ${config.connection.host}`);
    const jira = createJiraClient(config.connection, jiraToken);
    
    console.log(`Fetching issue: ${issueKey}`);
    const issueData = await jira.getIssue(issueKey, ["status", "fixVersions", "summary", "project"]);
    
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
    
    // Generate the JIRA release URL (same as in sync-issue.ts)
    const jiraReleaseUrl = `https://${config.connection.host}/projects/${issueData.fields.project.key}/versions/${jiraRelease.id}/tab/release-report-all-issues`;
    console.log(`JIRA release URL: ${jiraReleaseUrl}`);
    
    // Step 3: Connect to GitHub and check for milestone
    console.log("\n--- Step 3: Connecting to GitHub and checking for milestone ---");
    
    const octokit = github.getOctokit(githubToken);
    
    console.log(`Checking for milestone with JIRA URL: ${jiraReleaseUrl}`);
    const milestones = await getAllMilestones(octokit, repoOwner, repoName);
    
    console.log(`Found ${milestones.length} milestones (all pages)`);
    // Search by URL in description instead of title (matching sync-issue.ts logic)
    let milestone = milestones.find(m => 
      m.description && m.description.includes(jiraReleaseUrl)
    );
    
    if (milestone) {
      console.log(`Milestone found by URL: ${milestone.title} (${milestone.number})`);
      console.log(`Description: ${milestone.description}`);
      console.log(`Due date: ${milestone.due_on || 'No due date'}`);
      console.log(`Open issues: ${milestone.open_issues}`);
      console.log(`Closed issues: ${milestone.closed_issues}`);
      
      // Check if the milestone title matches the JIRA release name (same as sync-issue.ts)
      if (milestone.title !== jiraRelease.name) {
        console.log(`\nMilestone title "${milestone.title}" doesn't match JIRA release "${jiraRelease.name}".`);
        console.log("In production, this would be updated automatically.");
        
        // Uncomment to actually update the milestone title
        /*
        try {
          const updateData: any = {
            owner: repoOwner,
            repo: repoName,
            milestone_number: milestone.number,
            title: jiraRelease.name,
            description: `JIRA Release: ${jiraReleaseUrl}`,
          };

          // Preserve due date if it exists
          if (milestone.due_on) {
            updateData.due_on = milestone.due_on;
          } else if (jiraRelease.releaseDate) {
            // Add due date if JIRA has a release date but milestone doesn't
            const releaseDateTime = new Date(`${jiraRelease.releaseDate}T00:00:00Z`);
            releaseDateTime.setDate(releaseDateTime.getDate() + 1);
            updateData.due_on = releaseDateTime.toISOString();
          }

          const { data: updatedMilestone } = await octokit.rest.issues.updateMilestone(
            updateData
          );
          milestone = updatedMilestone;
          console.log(`Updated milestone title to: ${milestone.title}`);
        } catch (updateError) {
          console.error(`Error updating milestone title: ${updateError.message}`);
        }
        */
      } else {
        console.log(`Milestone title matches JIRA release name: ${jiraRelease.name}`);
      }
      
      // Step 4: Test updating a PR with the milestone (if PR number is provided)
      const testPrNumber = process.env.TEST_PR_NUMBER;
      if (testPrNumber) {
        console.log("\n--- Step 4: Testing PR update with milestone ---");
        console.log(`Attempting to update PR #${testPrNumber} with milestone: ${milestone.title} (${milestone.number})`);
        
        try {
          const updateSuccess = await updatePrWithMilestone(
            octokit,
            repoOwner,
            repoName,
            parseInt(testPrNumber),
            { number: milestone.number, title: milestone.title }
          );

          if (!updateSuccess) {
            console.error("Failed to update PR with milestone");
          }
        } catch (updateError) {
          console.error(`Error updating PR with milestone: ${updateError.message}`);
          if (updateError.response) {
            console.error(`Status: ${updateError.response.status}, Data: ${JSON.stringify(updateError.response.data)}`);
          }
        }
      } else {
        console.log("\nSkipping PR update test (TEST_PR_NUMBER not provided)");
        console.log("To test PR updates, set the TEST_PR_NUMBER environment variable");
      }
    } else {
      console.log(`Milestone not found. Would create new milestone: ${jiraRelease.name}`);
      
      // Uncomment to actually create the milestone
      /*
      const milestoneData: any = {
        owner: repoOwner,
        repo: repoName,
        title: jiraRelease.name,
        description: `JIRA Release: ${jiraReleaseUrl}`,
      };
      
      // Add due date if available (same logic as sync-issue.ts)
      if (jiraRelease.releaseDate) {
        // Add 24 hours to the release date
        const releaseDateTime = new Date(`${jiraRelease.releaseDate}T00:00:00Z`);
        releaseDateTime.setDate(releaseDateTime.getDate() + 1);
        milestoneData.due_on = releaseDateTime.toISOString();
      }
      
      const { data: newMilestone } = await octokit.rest.issues.createMilestone(milestoneData);
      milestone = newMilestone;
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