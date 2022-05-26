import * as P from "../pkgs/proj.js"
import * as Core from "../pkgs/core.js"
import * as Json from "../pkgs/json.js"
import { s } from "../pkgs/registry.js"
import { maybeStandAlone } from "./standalone_helper.js"

import * as Actions from "../actions.js"
import { TreeComponent } from "../components/tree_component.js"
import { renderRoot } from "../views/json_view.js"

export { elements, controller, structSheet, sheet as topSheet }

const extt = P.JSON_EXT
const extstr = P.structSheet.toStr[P.JSON_EXT]

const controller = {}
const sheet = {
  [extt]: {
    self: {
      off: [Actions.addFile, Actions.addFolder]
    },
    children: {
      tag: Core.TOPLV_TAG,
      anyOf: Json.tops,
      n: 1
    }
  },
}
const structSheet = {
  [s(Core).t]: Core.structSheet,
  [s(Json).t]: Json.structSheet
}

const { Selects } = Actions
const JSONTree = (conf = {}, store) => {
  let { target } = conf
  document.querySelector(target).setAttribute("data-ext", extstr)

  store = maybeStandAlone(store, extt, { ...conf, structSheet, extSheet: sheet })
  TreeComponent({
    store,
    target,
    treeKeyDownCmds: [
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
    ],
    textAreaKeyDownCmd: [
      ["Enter", Actions.submitEdit],
      ["Escape", Actions.escapeEdit]
    ],
    dblClickCmd: Actions.activateEditType,

    view: (s) => renderRoot(target, s || store, {
      ui: {
        lineClass: "",
        tab: 3,
        modelTypeText: (sch, ui) => sch.isEntry ? "entrypoint" : "type",
      }
    }),
    opts: {
      focus: conf.focus,
      selectId: conf.select
    }
  })
}

const elements = { [extt]: { body: JSONTree } }
