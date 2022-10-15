/* This file is used for both development and test environments */
/* Please keep this file as library Call Site only */
/*
  <project-store> emulates production use case such as `Project.router` so
  that we can integration test those edge of libaries.
*/

// Debug mode, import local files
import * as Model from "../lib/pkgs/model/index.js"
import * as Json from "../lib/pkgs/json/index.js"
import * as Html from "../lib/pkgs/html/index.js"
import * as Sheet from "../lib/pkgs/sheet/index.js"
import { define } from "../lib/elements/define.js"
import { remoteConnected, handleTreeCommand as handleTreeCommand_, schUpdate } from "../lib/actions/app.js"

// Preview mode, import bundled packages
// import { FileTree, Project } from "fset"
// import * as Model from "fset/pkgs/model.js"
// import * as Json from "fset/pkgs/json.js"
// import * as Html from "fset/pkgs/html.js"

import { buffer } from "../lib/utils.js"

const imports = [Model, Json, Html, Sheet]

export const start = (flags = { diff: true, async: true }) => {
  const buffer_ = flags.async ? buffer : f => f
  const handleTreeCommand = e => buffer_(handleTreeCommand_, 10)(e)

  const domEvents = [
    ["local-context", remoteConnected],
    ["tree-command", handleTreeCommand],
    ["sch-update", schUpdate],
  ]
  const opts = {
    // preFn: contextReq
  }

  const intialContext = { imports, flags }
  define("project-store", intialContext, domEvents, opts)
}

export const pullState = project => {
  // pulling state from fixture. This is state push approach. State is either from
  // local storage or network storage like db on server.
  document
    .querySelector("project-store")
    .dispatchEvent(new CustomEvent("local-context", { detail: { project } }))
}
