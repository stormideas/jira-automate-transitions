# Jira Ticket Transitioner

This action can move Jira issue to col of choice by event (e.g: move to IN REVIEW col when author requests review, move to IN PROGRESS if reviewer requests changes, move to QA if pr is merged).

# Inputs
* configPath - path to yaml file providing connection and transition rules confgiuration

# Envionment variables
* JIRA_API_TOKEN - api token to use with jira connection - if no password is provided in yaml file this one will be used.
* GITHUB_TOKEN - automatically provided by github CI it will be used to read github context object and extract information about the events


# config.yaml

config yaml is a yaml document describling connection params and transition rules. transition rules are processed sequentially and first rule that matches entirely is applied provided that current issue state allows such transition - if not transition is treated as not matching and next rule is applied.

see sample yaml config file

```yaml
# regexp pattern to use for issue key matching (matched case insensitive)
issueKeyRegExp: "ST-[0-9]+"

connection:
  # host to connect to
  host: "stormideas.atlassian.net"
  # user name to acces jira 
  username: "jira-test@getstoryteller.com"
  # password or token for jira - note that if you don't want to keep whole config as file secret you can use jiraToken action parameter
  password: "***"
# rules are list of condition to be met in order to apply transition to the ticket
rules:
  # this rule apply only if issue is in selected for development or in progress state
  - from:
      - "Selected for Development"
      - "In Progress"
   # transition to apply provided that give state allows such transition   
    transition: "In review"
    # on what action this rule should be applied - note that depending on the action other properties might not be defined
    on:
      # when action is pull request
      pull_request:
      # ... and targets develop
        targetBranches:
          - develop
      # ... and action is one of following    
        actions:
          - opened
          - reopened
          - synchronize
      # ... and is not a draft    
        draft: false
      # .. and is not yet merged  
        merged: false
  - from:
      - "In review"
    transition: "to be dev tested"
    on:
      pull_request:
        targetBranches:
          - develop
        actions:
          - closed
        # all given labels must be found  
        withLabel:
          - "to be dev tested"
        # none of given labels mus be found  
        withoutLabel:
          - "work in progress"
        draft: false
        merged: true

  -
    from:
      - "In review"
    transition: "To be tested"
    on:
      pull_request:
        targetBranches:
          - develop
        actions:
          - closed
        draft: false
        merged: true




```