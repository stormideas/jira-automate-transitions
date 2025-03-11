# Configuration Guide

This document provides detailed information about configuring the Jira Ticket Transitioner action.

## Configuration File

The action is configured using a YAML file. By default, the action looks for a file specified by the `configPath` input parameter.

## Basic Structure

The configuration file has the following structure:

```yaml
# Pattern to match JIRA issue keys
issueKeyRegExp: "PROJECT-[0-9]+"

# JIRA connection details
connection:
  host: "your-company.atlassian.net"
  username: "your-username@example.com"
  password: "your-api-token"  # Optional if using jiraToken input

# GitHub connection details (optional)
github:
  token: "your-github-token"  # Optional if using githubToken input

# Enable milestone synchronization (optional)
syncMilestones: true

# Transition rules
rules:
  - from:
      - "Status A"
      - "Status B"
    transition: "Target Status"
    on:
      pull_request:
        # Rule conditions...
```

## Configuration Options

### Issue Key Pattern

The `issueKeyRegExp` option specifies a regular expression pattern to match JIRA issue keys in PR titles and branch names.

```yaml
issueKeyRegExp: "PROJECT-[0-9]+"
```

### JIRA Connection

The `connection` section configures the connection to your JIRA instance:

```yaml
connection:
  host: "your-company.atlassian.net"  # JIRA host (without https://)
  username: "your-username@example.com"  # JIRA username (usually email)
  password: "your-api-token"  # JIRA API token (optional)
```

The `password` field is optional if you provide the JIRA API token via the `jiraToken` input parameter or the `JIRA_API_TOKEN` environment variable.

### GitHub Connection

The `github` section configures the connection to GitHub:

```yaml
github:
  token: "your-github-token"  # GitHub token
```

This is optional if you provide the GitHub token via the `githubToken` input parameter or the `GITHUB_TOKEN` environment variable.

### Milestone Synchronization

The `syncMilestones` option enables or disables the synchronization of GitHub milestones with JIRA releases:

```yaml
syncMilestones: true  # Enable milestone synchronization
```

When enabled, the action will:
1. Check if the JIRA issue has a fix version (release) assigned
2. Look for a corresponding GitHub milestone with the same name
3. Create the milestone if it doesn't exist, including the release date from JIRA
4. Add the PR to the milestone

### Transition Rules

The `rules` section defines the conditions under which JIRA tickets should transition:

```yaml
rules:
  - from:
      - "Status A"
      - "Status B"
    transition: "Target Status"
    on:
      pull_request:
        targetBranches:
          - main
          - develop
        actions:
          - opened
          - reopened
          - synchronize
        draft: false
        merged: false
        withLabel:
          - "label-a"
        withoutLabel:
          - "label-b"
```

Each rule consists of:

- `from`: List of JIRA statuses the issue can be in for the rule to apply
- `transition`: The target JIRA status to transition to
- `on`: Conditions for when the rule should apply

#### Rule Conditions

The `on` section can include:

- `pull_request`: Conditions for pull request events
  - `targetBranches`: List of target branch patterns
  - `actions`: List of PR actions (opened, closed, reopened, synchronize)
  - `draft`: Whether the PR is a draft
  - `merged`: Whether the PR is merged
  - `withLabel`: List of labels that must be present
  - `withoutLabel`: List of labels that must not be present

## Environment Variables

The action also supports the following environment variables:

- `JIRA_API_TOKEN`: JIRA API token (alternative to setting in config)
- `GITHUB_TOKEN`: GitHub token (provided automatically by GitHub Actions)

## Example Configuration

Here's a complete example configuration:

```yaml
issueKeyRegExp: "PROJECT-[0-9]+"

connection:
  host: "your-company.atlassian.net"
  username: "your-username@example.com"

github:
  token: "your-github-token"

syncMilestones: true

rules:
  - from:
      - "To Do"
      - "In Progress"
    transition: "In Review"
    on:
      pull_request:
        targetBranches:
          - main
          - develop
        actions:
          - opened
          - reopened
          - synchronize
        draft: false
        merged: false

  - from:
      - "In Review"
    transition: "Done"
    on:
      pull_request:
        targetBranches:
          - main
        actions:
          - closed
        draft: false
        merged: true
```

This configuration will:
1. Match JIRA issues with keys like "PROJECT-123"
2. Connect to your JIRA instance
3. Enable milestone synchronization
4. Transition issues from "To Do" or "In Progress" to "In Review" when a PR is opened
5. Transition issues from "In Review" to "Done" when a PR is merged to the main branch 