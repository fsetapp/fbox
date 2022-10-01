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
import { remoteConnected, handleTreeCommand } from "../lib/actions/app.js"

// Preview mode, import bundled packages
// import { FileTree, Project } from "fset"
// import * as Model from "fset/pkgs/model.js"
// import * as Json from "fset/pkgs/json.js"
// import * as Html from "fset/pkgs/html.js"

import { buffer } from "../lib/utils.js"

const imports = [Model, Json, Html, Sheet]

export const start = ({ project, diff = true, async = true }) => {
  const buffer_ = async ? buffer : f => f
  const flags = { diff, async }
  const domEvents = [
    ["tree-command", buffer_(handleTreeCommand, 10)],
    ["sch-update", () => { console.log("sch-update") }],
  ]
  const opts = {
    connected: remoteConnected
  }

  define("project-store", { project, imports, flags }, domEvents, opts)
}
