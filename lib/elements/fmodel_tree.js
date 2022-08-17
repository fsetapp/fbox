import * as P from "../pkgs/proj.js"
import * as Core from "../pkgs/core.js"
import * as Model from "../pkgs/model.js"
import { s } from "../pkgs/registry.js"
import { maybeStandAlone } from "./standalone_helper.js"

import * as Actions from "../actions.js"
import { TreeComponent } from "../components/tree_component.js"
import { renderRoot } from "../views/model_view.js"
import { controller as controller_ } from "../controllers/model.js"
import { diffableActs as diffableActs_ } from "../controllers/file_body.js"

export { elements, controller, diffableActs, structSheet, sheet as topSheet }

const extt = P.MODEL_EXT
const extstr = P.structSheet.toStr[P.MODEL_EXT]

const controller = { [extstr]: controller_ }
const diffableActs = { [extstr]: diffableActs_ }
const sheet = {
  [extt]: {
    self: {
      off: [Actions.addFile, Actions.addFolder]
    },
    children: {
      tag: Core.TOPLV_TAG,
      anyOf: Model.tops,
      defaultSch: 1
    }
  },
}
const structSheet = {
  [s(Core).t]: Core.structSheet,
  [s(Model).t]: Model.structSheet,
}

const { Selects } = Actions
const FmodelTree = (conf = {}, store) => {
  let { target } = conf
  document.querySelector(target).setAttribute("data-ext", extstr)

  store = maybeStandAlone(store, extt, { ...conf, structSheet, extSheet: sheet })

  const textAreaKeyDownCmd = {
    kbd: [
      ["Enter", Actions.submitEdit],
      ["Escape", Actions.escapeEdit]
    ]
  }
  const keydownCmds = {
    pre: ({ e }) => {
      switch (e.code) {
        case "ArrowUp": e.preventDefault(); break
        case "ArrowDown": e.preventDefault(); break
      }
    },
    kbd: [
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
    selector: [
      ["textarea", textAreaKeyDownCmd]
    ]
  }

  TreeComponent({
    store,
    target,
    domEvents: [
      ["click", { pre: Selects.clickSelect }],
      ["dblclick", Actions.activateEditTarget],
      ["keydown", keydownCmds],
    ],
    view: (s) => renderRoot(target, s || store, {
      ui: {
        lineClass: "setnu",
        tab: 3,
        modelTypeText: (sch, ui) => sch.isEntry ? "entrypoint" : "type",
      }
    }),
    opts: {
      focus: conf.focus,
      selectId: conf.select,
      rendered: tree => { for (let i = 0; i < 2; i++) tree._walker.nextNode() }
    }
  })
}

const ReadOnlyFmodelTree = (conf = {}, store) => {
  let { target, select, focus = false } = conf
  document.querySelector(target).setAttribute("data-ext", "fmodel")

  store = maybeStandAlone(store, extt, conf)
  TreeComponent({
    store,
    target,
    treeKeyDownCmds: [
      ["ArrowUp", Selects.selectUp],
      ["ArrowDown", Selects.selectDown],
      ["ArrowRight", Selects.expandSelected],
      ["ArrowLeft", Selects.collapseSelected],
    ],
    textAreaKeyDownCmd: [
    ],
    view: (s) => renderRoot(target, s || store, {
      ui: {
        lineClass: "setnu",
        tab: 3,
        modelTypeText: (sch, ui) => sch.isEntry ? "entrypoint" : "type",
      }
    }),
    opts: {
      focus: focus,
      selectId: select
    }
  })
}

const elements = { [extt]: { body: FmodelTree }, ReadOnlyFmodelTree }
