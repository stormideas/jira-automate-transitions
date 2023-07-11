
import "console"
import wcmatch from 'wildcard-match'

import { loadConfig } from "../load-config"
import * as fs from "fs"
import { JiraApiOptions } from "jira-client"
import * as JiraAPi from "jira-client"


async function run() {
  const { GITHUB_TOKEN, JIRA_API_TOKEN } = process.env
  
  const regexp = new RegExp("ST-[0-9]+","ig")
  // const res = branch.matchAll(regexp)

  const branch = "feature/test"
  const isMatch= wcmatch("feature/*") 

  console.log(`branch ${branch} pattern ${isMatch.pattern} ${isMatch(branch)}`)

}
run()
