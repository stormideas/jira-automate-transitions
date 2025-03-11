# Development Guide

This document provides information for developers working on the Jira Ticket Transitioner action.

## Unit Tests with Jest

The project uses Jest for unit testing and code coverage. Unit tests are located in the `tests/unit` directory.

### Running Unit Tests

To run all unit tests:

```bash
npm test
```

To run tests in watch mode (useful during development):

```bash
npm run test:watch
```

To run tests with coverage reporting:

```bash
npm run test:coverage
```

This will generate a coverage report in the `coverage` directory and display a summary in the terminal.

### Writing Unit Tests

When adding new features or modifying existing ones, please add or update the corresponding unit tests. Tests should be placed in the `tests/unit` directory with a filename that matches the source file being tested, with a `.test.ts` extension.

For example:
- Source file: `src/load-config.ts`
- Test file: `tests/unit/load-config.test.ts`

### Mocking Dependencies

Jest is configured to automatically mock external dependencies. When testing modules that depend on external services (like JIRA or GitHub), you should create mock implementations of those services.

Example of mocking the JIRA client:

```typescript
// Create mock functions
const mockGetIssue = jest.fn().mockResolvedValue({
  fields: {
    status: { name: 'Open' },
    fixVersions: []
  }
});

// Mock the module
jest.mock('jira-client', () => {
  return function() {
    return {
      getIssue: mockGetIssue,
      // Add other methods as needed
    };
  };
});
```

### Code Coverage

The project aims for high code coverage. Current coverage thresholds are set in `jest.config.js`. When adding new code, please ensure that it's properly covered by tests.

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

## Release Process

The repository includes a GitHub Actions workflow that automates the release process. This workflow is triggered when a release branch is opened against the main branch.

### Release Branch Automation

The workflow performs the following steps:

1. **Version Bumping**: Automatically extracts the version number from the release branch name (e.g., `release/4.0.0` → `4.0.0`) and updates it in `package.json`.

2. **Test Execution**: Runs all tests with code coverage reporting.

3. **Test Results**: Posts test results and code coverage statistics as a comment on the PR.

4. **Build Process**: Runs `npm run build` to generate the production build.

5. **Commit Changes**: If tests pass, automatically commits the version bump and build changes to the release branch.

### How to Use the Release Workflow

1. Create a new branch with the naming pattern `release/X.Y.Z` (where X.Y.Z is the semantic version)
2. Open a pull request from this branch to the main branch
3. The workflow will automatically run and update your PR

### Requirements

- The release branch name must follow the pattern `release/X.Y.Z` (e.g., `release/4.0.0`)
- Tests must pass for the workflow to commit changes

If tests fail, the workflow will post the failure details to the PR but will not commit any changes.
