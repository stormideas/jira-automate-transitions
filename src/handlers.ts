import { JiraClient } from "./jira";
import { HandleTransitionParams, TransitionParams } from "./interfaces";
import * as core from "@actions/core";
import { countReset } from "console";
import { parseString } from "./get-args";

const transitionIssue = async ({
  jiraTokenEncoded,
  jiraEndpoint,
  jiraIssueId,
  colName
}: TransitionParams) => {
  core.info(`Moving issue ${jiraIssueId} to ${colName}`);
  return;

  const jira = new JiraClient(jiraTokenEncoded);

  const issueDetail = await jira.request(
    `${jiraEndpoint}/rest/api/3/issue/${jiraIssueId}`
  );

  core.info(`url: ${jiraEndpoint}/rest/api/3/issue/${jiraIssueId}`);
  core.info(`detail: ${issueDetail}`);

  const {
    fields: {
      status: { name }
    }
  } = issueDetail;
  core.info(`name: ${name}, colName: ${colName}`);

  if (name === colName) {
    core.warning(`
        The issue ${jiraIssueId} is already in status ${colName}.
        Action will exit without doing anything.  
      `);
  } else {
    const availableTransitions = await jira.request(
      `${jiraEndpoint}/rest/api/3/issue/${jiraIssueId}/transitions`
    );

    core.info(`transitions: ${JSON.stringify(availableTransitions)}`)

    const transitionId = availableTransitions.transitions?.find(
      (t: any) => t.name === colName
    )?.id;
    if (!transitionId)
      throw new Error(`
      There was an error trying to transition issue ${jiraIssueId}:
      Transition to status "${colName}" cannot be found.
      Check all of the transitions' rules, conditions of yourr project's workflow.
      See more: https://confluence.atlassian.com/adminjiraserver073/working-with-workflows-861253510.html
    `);
    core.info(`Changing issue ${jiraIssueId} to ${colName}`);
    await jira.request(
      `${jiraEndpoint}/rest/api/3/issue/${jiraIssueId}/transitions`,
      "POST",
      { transition: { id: transitionId } }
    );
  }
};

const handleTransitionIssue = async ({
  resolveTicketIdsFunc,
  searchString,
  ...rest
}: HandleTransitionParams) => {
  const resolverFunc = resolveTicketIdsFunc ?? parseString;
  const issues = await resolverFunc(searchString);

  if (issues.length == 0) {
    core.info('No issues detected in PR details')
  }

  issues.forEach(jiraIssueId => {
    transitionIssue({ ...rest, jiraIssueId });
  });
};

export { handleTransitionIssue };
