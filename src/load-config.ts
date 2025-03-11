import * as fs from "fs/promises";
import * as jsyaml from "js-yaml";
import { TransitionRule } from "./sync-issue";

async function loadConfig(configPath: string): Promise<Config> {
  const yaml = jsyaml.load(await fs.readFile(configPath, "utf8")) as Config;
  return yaml;
}
type ConnectionCfg = {
  host: string;
  username: string;
  passsword?: string;
};

type GitHubConnectionCfg = {
  token?: string;
};

type Config = {
  connection: ConnectionCfg;
  github?: GitHubConnectionCfg;
  rules: Array<TransitionRule>;
  issueKeyRegExp: string;
  syncMilestones?: boolean;
};

export { loadConfig, ConnectionCfg, GitHubConnectionCfg, Config };
