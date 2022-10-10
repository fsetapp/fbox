import * as Core from "../core.js"
import * as Html from "../html.js"
import { s } from "../registry.js"
import { HTMLTree } from "../../elements/html_tree.js"

export { elements, controller, deps, Html as module }

const extt = Html.MODULE

const controller = {}

const deps = {
  [s(Core).t]: Core.structSheet,
  [s(Html).t]: Html.structSheet
}

const elements = { [extt]: { body: HTMLTree } }
