# Jira Ticket Transitioner Documentation

Welcome to the documentation for the Jira Ticket Transitioner GitHub Action. This documentation provides detailed information about the action, its features, configuration options, and development guidelines.

## Table of Contents

- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Features](#features)
- [Development](#development)
- [Progress](#progress)

## Getting Started

The Jira Ticket Transitioner is a GitHub Action that automates JIRA ticket transitions based on GitHub PR events. It can also synchronize GitHub milestones with JIRA releases.

To get started, add the action to your GitHub workflow:

```yaml
name: JIRA Transition

on:
  pull_request:
    types: [opened, reopened, closed, synchronize]

jobs:
  transition:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: JIRA Transition
        uses: your-org/jira-automate-transitions@v1
        with:
          configPath: '.github/jira-config.yml'
          jiraToken: ${{ secrets.JIRA_API_TOKEN }}
          githubToken: ${{ secrets.GITHUB_TOKEN }}
```

## Configuration

The action is configured using a YAML file. See the [Configuration Guide](configuration.md) for detailed information about all configuration options.

Key configuration options:

- `issueKeyRegExp`: Pattern to match JIRA issue keys
- `connection`: JIRA connection details
- `github`: GitHub connection details
- `syncMilestones`: Enable/disable milestone synchronization
- `rules`: Transition rules based on PR events

For a basic configuration example, see the [README](../README.md).

## Features

The action provides several features:

- **Automatic Transitions**: Move JIRA tickets through workflow states based on PR events
- **Milestone Synchronization**: Link GitHub PRs to milestones corresponding to JIRA releases
- **Configurable Rules**: Define custom rules for when and how tickets should transition

For a complete list of implemented and planned features, see the [Progress](progress.md) document.

## Development

For information on local development and testing, see the [Development Guide](../DEVELOPMENT.md).

## Progress

To track the implementation progress of features and improvements, see the [Progress](progress.md) document. 