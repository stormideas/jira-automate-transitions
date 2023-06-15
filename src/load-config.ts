import * as fs from "fs/promises"
import * as jsyaml from "js-yaml"
import { TransitionRule } from "./sync-issue"

async function loadConfig(configPath:string) : Promise<Config>{
    
     const yaml = jsyaml.load(await fs.readFile(configPath, "utf8")) as Config; 
     return yaml

}
type ConnectionCfg = {
    host: string,
    username: string
    passsword?: string
}


type Config = {
    connection: ConnectionCfg,
    rules: Array<TransitionRule>,
    issueKeyRegexp: string
}

export { loadConfig, ConnectionCfg, Config }