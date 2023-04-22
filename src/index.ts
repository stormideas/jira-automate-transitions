import * as core from "@actions/core";
import { getArgs, parseString } from "./get-args";
import { ParsedResult } from "./interfaces";
import * as github from "@actions/github";
import { Github } from "./github";
import { handleTransitionIssue } from "./handlers";
import * as Webhooks from "@octokit/webhooks";

async function run() {
  try {
    const { parsedInput, success, exit, message } = getArgs() as ParsedResult;
    if (!parsedInput && !success && exit && message) {
      core.warning(message);
    } else if (!parsedInput) {
      throw new Error("Error trying to parse input.");
    } else {
      const context = github.context;

      const {
        repo: { owner, repo },
        payload,
        eventName
      } = context;
      core.info(`eventName: ${eventName}`);
      core.info(`payload.action: ${payload.action}`);

      switch (eventName) {
        case "pull_request":
          const {
            pull_request: {
              labels,
              title,
              merged,
              head: { ref }
            }
          } = payload as Webhooks.WebhookPayloadPullRequest;

          const stringToCheck = `${ref} ${title}`;
          core.info(`PR description: ${stringToCheck}`);

          switch (payload.action) {
            case "review_requested": {
              await handleTransitionIssue({
                ...parsedInput,
                colName: parsedInput.columnToMoveToWhenReviewRequested,
                prString: stringToCheck
              });
              break;
            }
            case "closed": {
              const devTestedLabel = labels.find(
                (t: any) => t.name === parsedInput.prLabelToBeDevTested
              );

              var colName = parsedInput.columnToMoveToWhenMerged;

              if (devTestedLabel) {
                colName = parsedInput.columnToMoveToWhenMergedToBeDevTested;
              }

              if (merged && colName) {
                await handleTransitionIssue({
                  ...parsedInput,
                  colName: colName,
                  prString: stringToCheck
                });
              }
              break;
            }
          }
          break;
        case "pull_request_review":
          if (payload.action === "submitted") {
            const {
              pull_request: {
                title,
                number,
                head: { ref }
              },
              review: { id }
            } = context.payload as Webhooks.WebhookPayloadPullRequestReview;

            const stringToCheck = `${ref} ${title}`;
            core.info(`PR description: ${stringToCheck}`);

            const { githubToken } = parsedInput;
            const githubWrapper = new Github(githubToken, owner, repo);
            const isRequestChange = await githubWrapper.checkReviewIsRequestChange({
              pull_number: number,
              review_id: id
            });

            if (isRequestChange) {
              await handleTransitionIssue({
                ...parsedInput,
                colName: parsedInput.columnToMoveToWhenChangesRequested,
                prString: stringToCheck
              });
            }
          }
          break;
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
