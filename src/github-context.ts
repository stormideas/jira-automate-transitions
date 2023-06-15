import "@actions/core"
import { context as ghCtx } from "@actions/github"
import { WebhookPayload } from "@actions/github/lib/interfaces"
import "console"



interface CiContext {
    event: string
    targetBranch?: string
    sourceBranch?: string
    action?: string
    isMerged?: boolean
    isDraft?: boolean,
    title: string,
    body: string
}
function affectedIssues(ciCtx: CiContext, pattern: string): Set<string> {
    let ret = new Set<string>()
    const regexp = new RegExp(pattern, "ig") as RegExp

    const srcBranch = ciCtx.sourceBranch
    if (srcBranch) {
        let matches = srcBranch.matchAll(regexp)
        for (const key in matches) {
            ret.add(key)
        }
    }
    const title = ciCtx.title
    let matches = title.matchAll(regexp)
    for (const key in matches) {
        ret.add(key)
    }

    return ret
}

function getCiContext(): CiContext {
    // console.log("Github context")
    // console.log(JSON.stringify(ghCtx,null,4))
    const payload = ghCtx.payload

    const event = ghCtx.eventName
    const action = payload.action
    const isMerged = payload.pull_request.merged
    const isDraft = payload.pull_request.draft
    const targetBranch = payload.pull_request.base.ref
    const sourceBranch = payload.pull_request.head.ref
    const title = payload.pull_request.title
    const body = payload.pull_request.body

    return {
        event: event,
        targetBranch: targetBranch,
        sourceBranch: sourceBranch,
        action: action,
        isMerged: isMerged,
        isDraft: isDraft,
        title: title,
        body: body
    }

}

export { getCiContext, CiContext, affectedIssues }