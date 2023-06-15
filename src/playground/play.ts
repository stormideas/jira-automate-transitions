
import "console"
import { syncIssuess } from "../sync-issue"
import { loadConfig } from "../load-config"
import * as fs from "fs"
import {JiraApiOptions} from "jira-client"


async function run(){
  const { GITHUB_TOKEN, JIRA_API_TOKEN } = process.env
  const yamlFile = "/Users/michaldabrowski/GIT/jira-automate-transitions/.jira/config.yaml"


  const cfg = await loadConfig(yamlFile)
  console.log(JSON.stringify(cfg,null,4))

  await syncIssuess("ST-6394", cfg)

}

run()
