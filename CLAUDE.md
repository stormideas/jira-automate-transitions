# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Building and Testing
- `npm run build` - Build the action using ncc
- `npm run watch` - Build in watch mode during development
- `npm test` - Run Jest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:jira` - Run JIRA integration test (requires credentials)
- `npm run test:milestone` - Run milestone synchronization test

### Running Locally
- `npm run run` - Run the action locally using ncc

## Architecture

This is a GitHub Action that automates JIRA ticket transitions based on GitHub events (PRs, merges, etc.) and optionally synchronizes GitHub milestones with JIRA fix versions.

### Core Components

**Entry Point (`src/index.ts`)**: Loads configuration, extracts GitHub context, identifies affected JIRA issues using regex pattern matching, and processes each issue.

**Issue Synchronization (`src/sync-issue.ts`)**: Contains the core logic for:
- Connecting to JIRA API using jira-client library
- Evaluating transition rules against current issue state and GitHub context
- Executing JIRA transitions when rules match
- Synchronizing GitHub milestones with JIRA fix versions (when enabled)

**Configuration Loading (`src/load-config.ts`)**: Parses YAML configuration files that define JIRA connection details, transition rules, and GitHub integration settings.

**GitHub Context (`src/github-context.ts`)**: Extracts relevant information from GitHub webhook events and identifies affected JIRA issues from PR titles and branch names.

### Key Patterns

- Configuration is YAML-based with connection details, issue regex patterns, and rule-based transitions
- Rules are processed sequentially until the first complete match is found
- Transitions only execute if JIRA allows the state change
- Milestone sync creates GitHub milestones from JIRA fix versions when `syncMilestones: true`
- Uses wildcard matching for branch patterns and label filtering

### Dependencies

- Built with TypeScript, compiled using `@zeit/ncc` for distribution
- Uses `jira-client` for JIRA API operations (imported via require)
- Uses `@actions/github` and `@actions/core` for GitHub Action integration
- Uses `js-yaml` for configuration parsing
- Uses `wildcard-match` for pattern matching in rules