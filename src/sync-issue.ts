import * as JiraApi from 'jira-client';

import { JiraApiOptions } from 'jira-client';
import "console"
import { Config } from './load-config';


async function syncIssuess(issueKey: string, config: Config) {
    const conCfg = config.connection
    const rules = config.rules

    let options: JiraApiOptions = {
        //critical without that post operations do not work
        protocol: "https",
        apiVersion: "2",
        host: conCfg.host,
        username: conCfg.username,
        password: conCfg.passsword ?? process.env.JIRA_API_TOKEN
    };
    const api = new JiraApi(options)
    const issueData = await api.getIssue(issueKey, ["status"])
    const allTransitions = (await api.listTransitions(issueKey)).transitions

    const selectedTransition = findTransitionIdByName(allTransitions, "In Progress")
    console.log(`Current ${issueKey} state [${issueData.fields.status.name}]`)
    console.log(`Tranistioning ${issueKey} with [${selectedTransition.name}]`)

    if (selectedTransition !== null) {
        const transitionRequest = {
            transition: { id: selectedTransition.id },
        }

        await api.transitionIssue(issueKey, transitionRequest)
        // await api.addComment(issueKey, `CI: Transitioned to ${selectedTransition.name}`)

        const issueDataUpdated = await api.getIssue(issueKey, ["status"])
        console.log(`Updated ${issueKey} state [${issueDataUpdated.fields.status.name}]`)
    }

}


function findTransitionIdByName(trs: any, name: string): any {
    const transiton: any = trs.find(value => {
        return value.name == name
    })

    return transiton
}

type TransitionRule = {
    from: Array<string>
    to: String
    on: [event: Criteria | null]

}

interface Criteria {
    actions?: Array<string> 
    targetBranches?: Array<string> | null
    merged?: boolean
    draft?: false
}

interface CiInfo {
    action: string,
    
}

export { syncIssuess, TransitionRule, Criteria }


