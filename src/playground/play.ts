
import "console"

import { loadConfig } from "../load-config"
import * as fs from "fs"
import { JiraApiOptions } from "jira-client"
import * as JiraAPi from "jira-client"


async function run() {
  const { GITHUB_TOKEN, JIRA_API_TOKEN } = process.env
  const yamlFile = "/Users/michaldabrowski/GIT/jira-automate-transitions/.jira/config.yaml"
  const jiraCfg: JiraApiOptions = {
    protocol: "https",
    apiVersion: "2",
    host: "stormideas.atlassian.net",
    username: "michal.dabrowski@getstoryteller.com",
    password: "ATATT3xFfGF0p5FRb3K54nscxiXDH8_itHBm_NV5thdoDxHIRUDIQSaiRc3vDv328uFZ7tVg41cG02sAKJI2OMJ-v5q3K_ZV2KnLCAry3jfxv4cEM3VBXYYjKaHJ9AChhnz5DC1atQvmObS_h3Jg93r_XVfWkGCT8MzbjtVmSTDuj8gN2OUJQYo=00E2483A"
  }
  const cfg  = (await loadConfig(yamlFile))
  console.log(JSON.stringify(cfg.rules,null,2))
  const jira = new JiraAPi(jiraCfg)
  const transitions = (await jira.listTransitions("ST-6394")).transitions.map(v => v.name)
  // console.log(JSON.stringify(transitions, null, 2))

}
run()
