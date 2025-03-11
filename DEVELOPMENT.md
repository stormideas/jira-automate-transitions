# Development Guide

This document provides information for developers working on the Jira Ticket Transitioner action.

## JIRA Integration Tests

The `test` directory contains tests for validating the JIRA API integration and milestone synchronization feature.

### Setup

1. Create a `.env` file in the root directory of the project based on the `.env.example` template:

```bash
cp .env.example .env
```

2. Edit the `.env` file and fill in the required values:

```
# JIRA API token
JIRA_API_TOKEN=your_jira_api_token_here

# GitHub token with repo scope
GITHUB_TOKEN=your_github_token_here

# Test issue key (e.g., "ST-1234")
TEST_ISSUE_KEY=your_test_issue_key_here

# GitHub repository information for milestone tests
TEST_REPO_OWNER=your_github_org_or_username
TEST_REPO_NAME=your_repository_name
```

3. Update the `test/test-config.yml` file with your JIRA host and username:

```yaml
connection:
  # Replace with your JIRA host
  host: "your-company.atlassian.net"
  # Replace with your JIRA username (email)
  username: "your-email@example.com"
```

### Running the Tests

#### Basic JIRA Integration Test

Run the basic JIRA integration test using the following command:

```bash
npm run test:jira
```

This will:
1. Connect to your JIRA instance using the provided credentials
2. Fetch the specified issue
3. Check if the issue has a fix version (release) assigned
4. Simulate adding the issue to a GitHub milestone

#### Milestone Synchronization Test

For a more comprehensive test that validates both JIRA integration and GitHub milestone synchronization:

```bash
npm run test:milestone
```

This test:
1. Connects to JIRA and fetches the issue details
2. Checks for fix versions assigned to the issue
3. Connects to GitHub and checks if a corresponding milestone exists
4. Provides detailed information about the milestone if it exists
5. Shows what would happen if the milestone needed to be created (without actually creating it)

### What's Being Tested

The tests validate:

1. JIRA API connection and authentication
2. Fetching issue details including fix versions
3. The milestone synchronization logic
4. GitHub API connection and milestone operations

### Troubleshooting

If you encounter errors:

1. Check that your JIRA API token is valid
2. Verify that the test issue key exists and is accessible
3. Ensure your GitHub token has the necessary permissions (repo scope)
4. Check the JIRA host and username in the test config file
5. Make sure the test issue has at least one fix version assigned in JIRA

## Building the Action

To build the action for production use:

```bash
npm run build
```

This will compile the TypeScript code and bundle it into a single file in the `dist` directory.

## Development Workflow

1. Make changes to the source code in the `src` directory
2. Run tests to validate your changes
3. Build the action
4. Commit and push your changes
