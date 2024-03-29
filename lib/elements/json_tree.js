import * as P from "../pkgs/proj.js"
import * as Core from "../pkgs/core.js"
import * as Json from "../pkgs/json.js"
import { s } from "../pkgs/registry.js"
import { maybeStandAlone } from "./standalone_helper.js"

import * as Actions from "../actions.js"
import { TreeComponent } from "../components/tree_component.js"
import { renderRoot } from "../views/json_view.js"

export { elements, controller, deps, Json as module }

const extt = Json.MODULE
const extstr = Json.PKG_NAME

const controller = {}
const deps = {
  [s(Core).t]: Core.structSheet,
  [s(Json).t]: Json.structSheet
}

const { Selects } = Actions
const JSONTree = (conf = {}, store) => {
  let { target } = conf
  document.querySelector(target).setAttribute("data-ext", extstr)

  const treeKeyDownCmds = [
    ["shift-meta-ArrowUp", Selects.selectMultiNodeUpTo],
    ["shift-meta-ArrowDown", Selects.selectMultiNodeDownTo],
    ["shift-ArrowUp", Selects.selectMultiNodeUp],
    ["shift-ArrowDown", Selects.selectMultiNodeDown],
    ["meta-ArrowUp", Selects.selectUpEnd],
    ["meta-ArrowDown", Selects.selectDownEnd],
    ["ArrowUp", Selects.selectUp],
    ["ArrowDown", Selects.selectDown],
    ["k", Selects.selectUp],
    ["j", Selects.selectDown],
    ["Home", Selects.selectRoot],
    ["End", Selects.selectLast],

    ["shift-+", Actions.addSch],
    ["Enter", Actions.activateEditKey],
    ["t", Actions.activateEditType],
    ["Delete", Actions.deleteSelected],
    ["m", Actions.markAsEntry],

    ["meta-x", Actions.cut],
    ["meta-c", Actions.copy],
    ["meta-v", Actions.paste],
    ["shift-alt-ArrowUp", Actions.cloneUp],
    ["shift-alt-ArrowDown", Actions.cloneDown],
    ["alt-ArrowUp", Actions.reorderUp],
    ["alt-ArrowDown", Actions.reorderDown],

    ["ArrowRight", Actions.expandSelected],
    ["ArrowLeft", Actions.collapseSelected],
    ["Escape", Actions.clearClipboard]
  ]

  const renderJson = s => renderRoot(target, s, {
    ui: {
      lineClass: "",
      tab: 3,
      modelTypeText: (sch, ui) => sch.isEntry ? "entrypoint" : "type",
    }
  })

  TreeComponent({
    store,
    target,
    domEvents: [
      ["dbclick", Actions.activateEditType],
      ["keydown", {
        pre: Selects.preventDefaultScroll,
        kbd: treeKeyDownCmds,
        selector: ["textarea", {
          kbd: [
            ["Enter", Actions.submitEdit],
            ["Escape", Actions.escapeEdit]
          ]
        }]
      }]
    ],
    view: { render: renderJson },
    opts: {
      focus: conf.focus,
      selectId: conf.select
    }
  })
}

const elements = { [extt]: { body: JSONTree } }
