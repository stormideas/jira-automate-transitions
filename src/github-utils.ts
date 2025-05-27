import * as github from "@actions/github";

/**
 * Helper function to fetch all milestones with pagination
 * @param octokit GitHub API client
 * @param owner Repository owner
 * @param repo Repository name
 * @returns Array of all milestones
 */
export async function getAllMilestones(
  octokit: ReturnType<typeof github.getOctokit>, 
  owner: string, 
  repo: string
) {
  const milestones: any[] = [];
  let page = 1;
  const perPage = 100; // Maximum allowed per page
  
  while (true) {
    const { data } = await octokit.rest.issues.listMilestones({
      owner,
      repo,
      state: "all",
      per_page: perPage,
      page: page
    });
    
    milestones.push(...data);
    
    // If we got fewer than perPage results, we've reached the end
    if (data.length < perPage) {
      break;
    }
    
    page++;
  }
  
  return milestones;
}

/**
 * Updates a PR with a milestone and verifies the update
 * @param octokit GitHub API client
 * @param owner Repository owner
 * @param repo Repository name
 * @param prNumber PR number
 * @param milestone Milestone object with number and title
 * @returns Promise that resolves when update is complete and verified
 */
export async function updatePrWithMilestone(
  octokit: ReturnType<typeof github.getOctokit>,
  owner: string,
  repo: string,
  prNumber: number,
  milestone: { number: number; title: string }
) {
  console.log(
    `Updating PR #${prNumber} with milestone: ${milestone.title} (ID: ${milestone.number})`
  );

  const { status } = await octokit.rest.issues.update({
    owner,
    repo,
    issue_number: prNumber,
    milestone: milestone.number,
  });

  console.log(`Update response status: ${status}`);
  
  if (status >= 200 && status < 300) {
    console.log(`Successfully updated PR with milestone: ${milestone.title}`);
    
    // Verify the update
    console.log("Verifying PR update...");
    const { data: updatedPr } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: prNumber,
    });

    if (updatedPr.milestone && updatedPr.milestone.number === milestone.number) {
      console.log("✅ Verification successful: PR has the correct milestone assigned");
      return true;
    } else {
      console.log("❌ Verification failed: PR does not have the expected milestone");
      console.log(
        `Current milestone: ${updatedPr.milestone ? updatedPr.milestone.title : "None"}`
      );
      return false;
    }
  } else {
    console.error(`Failed to update PR with milestone. Status: ${status}`);
    return false;
  }
} 