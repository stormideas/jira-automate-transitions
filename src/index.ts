import * as core from "@actions/core"
import * as github from "@actions/github"
import "console"

function run() {
  const ctx = JSON.stringify( github.context)
  console.log(`MAD branch ${ctx}`)
}

run()
