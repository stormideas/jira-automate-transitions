import "@actions/core"
import { context as ghCtx } from "@actions/github"
import "console"



interface CiContext {
    event: string
    targetBranch?: string
    sourceBranch?: string
    action?: string
    isMerged?: boolean
    isDraft?: boolean,
    title: string,
    body: string,
    labels: Array<string>
}
function affectedIssues(ciCtx: CiContext, pattern: string): Set<string> {
    let ret = new Set<string>()
    if(pattern === undefined){
        throw new Error("pattern to find issue key must be provided")
    }
    console.log(`Issue pattern "${pattern}"`)
    const regexp = new RegExp(pattern, "ig") as RegExp

    const srcBranch = ciCtx.sourceBranch
    if (srcBranch) {
        console.log(`Branch ${srcBranch}`)
        let matches = srcBranch.matchAll(regexp)
        for (const key of matches) {
            ret.add(key[0].toUpperCase())
        }
    }
    const title = ciCtx.title
    console.log(`Title ${title}`)
    let matches = title.matchAll(regexp)
    for (const key of matches) {
        ret.add(key[0].toUpperCase())
    }

    return ret
}

function getCiContext(): CiContext {
    const payload = ghCtx.payload

    const event = ghCtx.eventName
    const action = payload.action
    const isMerged = payload.pull_request.merged
    const isDraft = payload.pull_request.draft
    const targetBranch = payload.pull_request.base.ref
    const sourceBranch = payload.pull_request.head.ref
    const title = payload.pull_request.title
    const body = payload.pull_request.body

    const labelsObj = payload.pull_request.labels ?? new Array<any>
    
    const labels = labelsObj.map( (v: { name: string })  => v.name.toLowerCase())

    return {
        event: event,
        targetBranch: targetBranch,
        sourceBranch: sourceBranch,
        action: action,
        isMerged: isMerged,
        isDraft: isDraft,
        title: title,
        body: body,
        labels: labels
    }

}

export { getCiContext, CiContext, affectedIssues }