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
  ) => Promise<string[]>;
}

export interface JiraConfigFile {
  baseUrl: string;
  email: string;
  token: string;
}

export type ParsedInput = _Params & JiraConfig;
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
  prString: string;
};

export type TransitionParams = HandlerParams & {
  colName: string;
  jiraIssueId: string;
};
