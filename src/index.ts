import { CiContext, affectedIssues, getCiContext } from "./github-context"
import { Config, loadConfig } from "./load-config"
import * as Core from "@actions/core"
import "console"

async function run()  {
  const configPath = Core.getInput("configPath", { required: true , trimWhitespace:true }) 

  const ciCtx = getCiContext()

  console.log(JSON.stringify(ciCtx, null, 4))
  
  
  const config = await loadConfig(configPath)
  const issuesAffected =  affectedIssues(ciCtx,config.issueKeyRegexp)
  console.log("AFFECTED issues")
  for( const i in issuesAffected){
    console.log(` ${i}`)
  }

}

run().then(()=>{
  console.log("done")
})
