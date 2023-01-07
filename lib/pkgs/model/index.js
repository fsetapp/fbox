import * as Core from "../core.js"
import * as Model from "../model.js"
import { s } from "../registry.js"

import { controller as controller_ } from "../../controllers/model.js"
import { diffableActs as diffableActs_ } from "../../controllers/file_body.js"
import { ModelTree, ReadOnlyModelTree } from "../../elements/model_tree.js"

export { elements, controller, diffableActs, deps, Model as module }

const extt = Model.MODULE
const extstr = Model.PKG_NAME

const controller = { [extstr]: controller_ }
const diffableActs = { [extstr]: diffableActs_ }
// const elements = { [extt]: {} } is at the bottom of this file.

const deps = {
  [s(Core).t]: Core,
  [s(Model).t]: Model,
}

const elements = { [extt]: { body: ModelTree }, ReadOnlyModelTree }
