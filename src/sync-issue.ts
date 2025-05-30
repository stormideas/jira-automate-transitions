import * as Github from "@actions/core";
import "console";
import { Config, ConnectionCfg } from "./load-config";
import { CiContext } from "./github-context";
import { getAllMilestones, updatePrWithMilestone } from "./github-utils";
import { createJiraClient } from "./jira-utils";
import wcmatch from "wildcard-match";
import * as github from "@actions/github";

async function syncIssue(
  issueKey: string,
  ciCtx: CiContext,
  config: Config,
  jiraToken?: string
) {
  const conCfg = config.connection;
  const rules = config.rules;

  const api = createJiraClient(conCfg, jiraToken);

  console.log(`Syncing issue ${issueKey}`);
  const issueData = await api.getIssue(issueKey, [
    "status",
    "fixVersions",
    "project",
  ]);

  const allowedTransitions = (await api.listTransitions(issueKey)).transitions;
  const currentState = issueData.fields.status.name;
  console.log(`Current ${issueKey} state [${currentState}]`);

  const selectedTransition = findTransition(
    currentState,
    allowedTransitions,
    rules,
    ciCtx
  );

  if (selectedTransition !== null) {
    console.log(`Tranistioning ${issueKey} with [${selectedTransition?.name}]`);
    const transitionRequest = {
      transition: { id: selectedTransition.id },
    };

    await api.transitionIssue(issueKey, transitionRequest);

    const issueDataUpdated = await api.getIssue(issueKey, ["status"]);
    console.log(
      `Updated ${issueKey} state [${issueDataUpdated.fields.status.name}]`
    );
  } else {
    console.log("Not found proper transition rule");
  }

  // Sync milestone if enabled and we have PR information
  if (
    config.syncMilestones === true &&
    ciCtx.prNumber &&
    ciCtx.repo &&
    config.github?.token
  ) {
    await syncMilestone(issueData, ciCtx, config.github.token, conCfg);
  }
}

async function syncMilestone(
  issueData: any,
  ciCtx: CiContext,
  githubToken: string,
  conCfg: ConnectionCfg
) {
  if (!ciCtx.prNumber || !ciCtx.repo) {
    console.log(
      "Missing PR number or repository information. Cannot sync milestone."
    );
    return;
  }

  // Get fix versions from JIRA issue
  const fixVersions = issueData.fields.fixVersions || [];
  if (fixVersions.length === 0) {
    console.log(
      "No fix versions found for this issue. Skipping milestone sync."
    );
    return;
  }

  // Use the first fix version as the milestone
  const jiraRelease = fixVersions[0];
  const milestoneName = jiraRelease.name;
  const releaseDate = jiraRelease.releaseDate; // Format: YYYY-MM-DD
  const jiraReleaseUrl = `https://${conCfg.host}/projects/${issueData.fields.project.key}/versions/${jiraRelease.id}/tab/release-report-all-issues`;

  console.log(
    `Found JIRA release: ${milestoneName} with date: ${
      releaseDate || "No date"
    }`
  );

  try {
    // Initialize GitHub client with the newer API
    const octokit = github.getOctokit(githubToken);
    const { owner, name: repo } = ciCtx.repo;

    // Check if milestone exists - search by URL in description instead of title
    console.log(
      `Checking if milestone with JIRA URL "${jiraReleaseUrl}" exists in ${owner}/${repo}`
    );
    let milestone = null;
    const milestones = await getAllMilestones(octokit, owner, repo);

    console.log(`Found ${milestones.length} milestones (all pages)`);
    milestone = milestones.find((m) => 
      m.description && m.description.includes(jiraReleaseUrl)
    );

    if (milestone) {
      console.log(
        `Found existing milestone by URL: ${milestone.title} with ID: ${milestone.number}`
      );
      
      // Check if the milestone title matches the JIRA release name
      if (milestone.title !== milestoneName) {
        console.log(
          `Milestone title "${milestone.title}" doesn't match JIRA release "${milestoneName}". Updating...`
        );
        
        try {
          const updateData: any = {
            owner,
            repo,
            milestone_number: milestone.number,
            title: milestoneName,
            description: `JIRA Release: ${jiraReleaseUrl}`,
          };

          // Preserve due date if it exists
          if (milestone.due_on) {
            updateData.due_on = milestone.due_on;
          } else if (releaseDate) {
            // Add due date if JIRA has a release date but milestone doesn't
            const releaseDateTime = new Date(`${releaseDate}T00:00:00Z`);
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
          // Continue with the existing milestone even if update fails
        }
      }
    }

    // Create milestone if it doesn't exist
    if (!milestone) {
      console.log(`Creating new milestone: ${milestoneName}`);
      const milestoneData: any = {
        owner,
        repo,
        title: milestoneName,
        description: `JIRA Release: ${jiraReleaseUrl}`,
      };

      // Add due date if available
      if (releaseDate) {
        // Add 24 hours to the release date
        const releaseDateTime = new Date(`${releaseDate}T00:00:00Z`);
        releaseDateTime.setDate(releaseDateTime.getDate() + 1);
        milestoneData.due_on = releaseDateTime.toISOString();
      }

      try {
        const { data: newMilestone } = await octokit.rest.issues.createMilestone(
          milestoneData
        );
        milestone = newMilestone;
        console.log(`Created new milestone with ID: ${milestone.number}`);
      } catch (createError) {
        // Handle the case where milestone was created between our check and creation attempt
        if (createError.status === 422 && createError.response?.data?.errors?.some(e => e.code === 'already_exists')) {
          console.log(`Milestone "${milestoneName}" was created by another process. Fetching it...`);
          // Fetch the milestone that was just created - search by URL
          const updatedMilestones = await getAllMilestones(octokit, owner, repo);
          milestone = updatedMilestones.find((m) => 
            m.description && m.description.includes(jiraReleaseUrl)
          );
          if (milestone) {
            console.log(`Found the newly created milestone: ${milestone.title} with ID: ${milestone.number}`);
          } else {
            throw new Error(`Could not find milestone with JIRA URL "${jiraReleaseUrl}" after creation conflict`);
          }
        } else {
          throw createError;
        }
      }
    }

    // Update PR with milestone
    try {
      const updateSuccess = await updatePrWithMilestone(
        octokit,
        owner,
        repo,
        ciCtx.prNumber,
        { number: milestone.number, title: milestoneName }
      );

      if (!updateSuccess) {
        // Try an alternative approach if the first one fails
        console.log("Trying alternative approach to update PR...");
        try {
          // Verify the milestone exists and is valid
          const { data: verifiedMilestone } =
            await octokit.rest.issues.getMilestone({
              owner,
              repo,
              milestone_number: milestone.number,
            });

          console.log(
            `Verified milestone exists: ${verifiedMilestone.title} (${verifiedMilestone.number})`
          );

          // Try updating the PR again with explicit parameters
          const { status: altStatus } = await octokit.rest.issues.update({
            owner,
            repo,
            issue_number: ciCtx.prNumber,
            milestone: verifiedMilestone.number,
            title: ciCtx.title, // Preserve existing title
            body: ciCtx.body, // Preserve existing body
          });

          console.log(`Alternative update completed with status: ${altStatus}`);
        } catch (altError) {
          console.error(`Alternative approach also failed: ${altError.message}`);
        }
      }
    } catch (updateError) {
      console.error(`Error updating PR with milestone: ${updateError.message}`);
      if (updateError.response) {
        console.error(
          `Status: ${updateError.response.status}, Data: ${JSON.stringify(
            updateError.response.data
          )}`
        );
      }
    }
  } catch (error) {
    console.error(`Error syncing milestone: ${error.message}`);
    if (error.response) {
      console.error(
        `Status: ${error.response.status}, Data: ${JSON.stringify(
          error.response.data
        )}`
      );
    }
  }
}

function findTransition(
  currentState: string,
  allowedTransitions: any,
  rules: Array<TransitionRule>,
  ciCtx: CiContext
): any {
  const allowedTransitionNames = allowedTransitions.map(
    (v: { name: string }): WebGLQuery => v.name.toLowerCase()
  );
  console.log("Allowed transitions");
  console.log(JSON.stringify(allowedTransitionNames));
  for (const rule of rules) {
    console.log("Checking rule");
    console.log(JSON.stringify(rule, null, 2));

    const inCorrectState = rule.from
      .map((v) => v.toLowerCase())
      .includes(currentState.toLowerCase());
    console.log(`Current state ${currentState} satisfied ${inCorrectState}`);
    if (!inCorrectState) {
      continue;
    }
    const critieriaSatisfied = anyCriteriaMatches(ciCtx, rule);
    const transitionIsAllowed = allowedTransitionNames.includes(
      rule.transition.toLowerCase()
    );
    if (!transitionIsAllowed) {
      console.log(
        `Seleced transition ${rule.transition} is not allowed from current state  `
      );
      console.log(
        `${currentState} allowed transtions ${allowedTransitionNames}`
      );
    }
    if (inCorrectState && critieriaSatisfied && transitionIsAllowed) {
      return findTransitionIdByName(allowedTransitions, rule.transition);
    }
  }
  return null;
}
function anyCriteriaMatches(ciCtx: CiContext, rule: TransitionRule): boolean {
  console.log("Checking rule criterias");
  const criteria = rule.on[ciCtx.event] as Criteria;
  if (criteria === undefined) {
    console.log(`critieria for event ${ciCtx.event} not found`);
    return false;
  } else {
    console.log(JSON.stringify(criteria));
  }
  const actionSatisfied =
    criteria.actions === undefined || criteria.actions.includes(ciCtx.action);

  const draftSatisfied =
    criteria.draft === undefined || criteria.draft === ciCtx.isDraft;

  const mergedSatisfied =
    criteria.merged === undefined || criteria.merged === ciCtx.isMerged;

  const withLabelSatisfied =
    criteria.withLabel === undefined ||
    criteria.withLabel.every((v) => ciCtx.labels.includes(v.toLowerCase()));

  const withoutLabelSatisfied =
    criteria.withoutLabel === undefined ||
    criteria.withoutLabel.every((v) => !ciCtx.labels.includes(v.toLowerCase()));

  const targetBranchSatisfied =
    criteria.targetBranches === undefined ||
    criteria.targetBranches.some((pattern) => {
      const isMatch = wcmatch(pattern);
      const target = ciCtx.targetBranch;
      const matched = isMatch(target);
      console.log(
        `checking pattern ${isMatch.pattern} agains target ${target} `
      );
      console.log(`matched: ${matched} `);
      ciCtx.targetBranch;
      return matched;
    });
  console.log(`targetBranch satisfied ${targetBranchSatisfied}`);
  console.log(`action satisfied ${actionSatisfied}`);
  console.log(`withLabel satisfied ${withLabelSatisfied}`);
  console.log(`withoutLabel satisfied ${withoutLabelSatisfied}`);
  console.log(`draft satisfied ${draftSatisfied}`);
  console.log(`merge satisfied ${mergedSatisfied}`);
  const match =
    actionSatisfied &&
    draftSatisfied &&
    mergedSatisfied &&
    targetBranchSatisfied &&
    withLabelSatisfied &&
    withoutLabelSatisfied;
  console.log(`Found match : ${match}`);
  if (match) {
    console.log(`Transition : ${rule.transition}`);
  }
  return match;
}

function findTransitionIdByName(trs: any, name: string): any {
  const transiton: any = trs.find((value) => {
    return value.name.toLowerCase() == name.toLowerCase();
  });

  return transiton;
}

type TransitionRule = {
  from: Array<string>;
  transition: string;
  on: { [event: string]: Criteria };
};

interface Criteria {
  actions?: Array<string>;
  targetBranches?: Array<string>;
  merged?: boolean;
  draft?: false;
  withLabel?: Array<string>;
  withoutLabel?: Array<string>;
}

export { syncIssue, TransitionRule, Criteria };
