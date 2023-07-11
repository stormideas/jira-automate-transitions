import * as JiraApi from 'jira-client';
import * as Github from '@actions/core'
import { JiraApiOptions } from 'jira-client';
import "console"
import { Config } from './load-config';
import { CiContext } from './github-context';
import wcmatch from "wildcard-match"


async function syncIssue(issueKey: string, ciCtx: CiContext, config: Config, jiraToken?: string) {
    const conCfg = config.connection
    const rules = config.rules

    let options: JiraApiOptions = {
        //critical without that post operations do not work
        protocol: "https",
        apiVersion: "2",
        host: conCfg.host,
        username: conCfg.username,
        password: conCfg.passsword ?? jiraToken ?? process.env.JIRA_API_TOKEN
    };
    console.log("Jira Using connection: ")
    console.log(JSON.stringify(options, null, 2))


    const api = new JiraApi(options)

    console.log(`Syncing issue ${issueKey}`)
    const issueData = await api.getIssue(issueKey, ["status"])

    const allowedTransitions = (await api.listTransitions(issueKey)).transitions
    const currentState = issueData.fields.status.name
    console.log(`Current ${issueKey} state [${currentState}]`)

    const selectedTransition = findTransition(currentState, allowedTransitions, rules, ciCtx)

    if (selectedTransition !== null) {
        console.log(`Tranistioning ${issueKey} with [${selectedTransition?.name}]`)
        const transitionRequest = {
            transition: { id: selectedTransition.id },
        }

        await api.transitionIssue(issueKey, transitionRequest)

        const issueDataUpdated = await api.getIssue(issueKey, ["status"])
        console.log(`Updated ${issueKey} state [${issueDataUpdated.fields.status.name}]`)
    } else {
        console.log("Not found proper transition rule")
    }

}

function findTransition(currentState: string, allowedTransitions: any, rules: Array<TransitionRule>, ciCtx: CiContext): any {
    const allowedTransitionNames = allowedTransitions.map((v: { name: string; }): WebGLQuery => v.name.toLowerCase())
    console.log("Allowed transitions")
    console.log(JSON.stringify(allowedTransitionNames))
    for (const rule of rules) {
        console.log("Checking rule")
        console.log(JSON.stringify(rule, null, 2))

        const inCorrectState = rule.from.map(v => v.toLowerCase()).includes(currentState.toLowerCase())
        console.log(`Current state ${currentState} satisfied ${inCorrectState}`)
        if (!inCorrectState) {
            continue
        }
        const critieriaSatisfied = anyCriteriaMatches(ciCtx, rule)
        const transitionIsAllowed = allowedTransitionNames.includes(rule.transition.toLowerCase())
        if (!transitionIsAllowed) {
            console.log(`Seleced transition ${rule.transition} is not allowed from current state  `)
            console.log(`${currentState} allowed transtions ${allowedTransitionNames}`)
        }
        if (inCorrectState && critieriaSatisfied && transitionIsAllowed) {

            return findTransitionIdByName(allowedTransitions, rule.transition)

        }
    }
    return null
}
function anyCriteriaMatches(ciCtx: CiContext, rule: TransitionRule): boolean {
    console.log("Checking rule criterias")
    const criteria = rule.on[ciCtx.event] as Criteria
    if (criteria === undefined) {
        console.log(`critieria for event ${ciCtx.event} not found`)
        return false
    } else {
        console.log(JSON.stringify(criteria))
    }
    const actionSatisfied = criteria.actions === undefined || criteria.actions.includes(ciCtx.action)

    const draftSatisfied = criteria.draft === undefined || criteria.draft === ciCtx.isDraft

    const mergedSatisfied = criteria.merged === undefined || criteria.merged === ciCtx.isMerged

    const withLabelSatisfied = criteria.withLabel === undefined || criteria.withLabel.every(v => ciCtx.labels.includes(v.toLowerCase()))

    const withoutLabelSatisfied = criteria.withoutLabel === undefined || criteria.withoutLabel.every(v => !ciCtx.labels.includes(v.toLowerCase()))

    const targetBranchSatisfied = criteria.targetBranches === undefined || criteria.targetBranches.some( pattern => {
        const isMatch  = wcmatch(pattern)
        const target = ciCtx.targetBranch
        const matched = isMatch(target)
        console.log(`checking pattern ${isMatch.pattern} agains target ${target} `)
        console.log(`matched: ${matched} `)
        ciCtx.targetBranch
        return matched
    })
    console.log(`targetBranch satisfied ${targetBranchSatisfied}`)
    console.log(`action satisfied ${actionSatisfied}`)
    console.log(`withLabel satisfied ${withLabelSatisfied}`)
    console.log(`withoutLabel satisfied ${withoutLabelSatisfied}`)
    console.log(`draft satisfied ${draftSatisfied}`)
    console.log(`merge satisfied ${mergedSatisfied}`)
    const match = actionSatisfied && draftSatisfied && mergedSatisfied && targetBranchSatisfied && withLabelSatisfied && withoutLabelSatisfied
    console.log(`Found match : ${match}`)
    if (match) {
        console.log(`Transition : ${rule.transition}`)
    } 
    return match
}


function findTransitionIdByName(trs: any, name: string): any {
    const transiton: any = trs.find(value => {
        return value.name.toLowerCase() == name.toLowerCase()
    })

    return transiton
}

type TransitionRule = {
    from: Array<string>
    transition: string
    on: [event: Criteria]

}

interface Criteria {
    actions?: Array<string>
    targetBranches?: Array<string>
    merged?: boolean
    draft?: false
    withLabel?: Array<string>,
    withoutLabel?: Array<string>

}


export { syncIssue, TransitionRule, Criteria }


