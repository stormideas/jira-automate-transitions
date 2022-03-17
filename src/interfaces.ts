export interface JiraConfig {
  jiraEndpoint: string;
  jiraAccount: string;
  jiraToken: string;
  jiraIssueId: string;
  jiraTokenEncoded: string;
}

interface _Params {
  githubToken: string;
  columnToMoveToWhenReviewRequested: string;
  columnToMoveToWhenChangesRequested: string;
  columnToMoveToWhenMerged?: string;
  columnToMoveToWhenMergedToBeDevTested?: string;
  prLabelToBeDevTested?: string;
  resolveTicketIdsFunc?: (
    branchName: string
  ) => Promise<string[] | string | void>;
}

interface AdditionalJiraConfig {
  jiraProject: string;
  jiraIssueNumber: number;
}

export interface JiraConfigFile {
  baseUrl: string;
  email: string;
  token: string;
}

type Params = _Params & JiraConfig;
export type ParsedInput = Params & AdditionalJiraConfig;
export interface ParsedResult {
  success: boolean;
  exit: boolean;
  message?: string;
  parsedInput?: ParsedInput | null;
}
type HandlerParams = Pick<
  ParsedInput,
  "jiraTokenEncoded" | "jiraEndpoint" | "jiraIssueId" | "resolveTicketIdsFunc"
>;

export type HandleTransitionParams = HandlerParams & {
  colName: string;
  branchName?: string;
};
