import { CiContext, affectedIssues, getCiContext } from "./github-context"
import { Config, loadConfig } from "./load-config"
import * as Core from "@actions/core"
import "console"
import { syncIssue } from "./sync-issue"

async function run() {
  const configPath = Core.getInput("configPath", { required: true, trimWhitespace: true })
  let jiraToken = Core.getInput("jiraToken", { required: false, trimWhitespace: true })
  if (jiraToken.length == 0) {
      jiraToken = undefined
  }

  const config = await loadConfig(configPath)

  const ciCtx = getCiContext()
  console.log("GitubContext:")
  console.log(JSON.stringify(ciCtx, null, 4))


  const issuesAffected = affectedIssues(ciCtx, config.issueKeyRegExp)
  console.log("AFFECTED issues")
  for (const key of issuesAffected) {
    console.log(` ${key}`)
    syncIssue(key, ciCtx, config, jiraToken)
  }
}

run()