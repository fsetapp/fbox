import * as Core from "../pkgs/core.js"
import * as Model from "../pkgs/model.js"
import { s } from "../pkgs/registry.js"

import * as Actions from "../actions.js"
import * as AriaTree from "../aria_tree.js"

import { TreeComponent } from "../components/tree_component.js"
import { renderRoot } from "../views/model_view.js"

export { FmodelTree, ReadOnlyFmodelTree, structSheet }

const sheet = t => lookup[t] || lookup["default"]
const lookup = {
  ["model_ext"]: {
    self: {
      exceptActions: [Actions.addFile, Actions.addFolder, Actions.paste]
    },
    children: {
      tag: Core.TOPLV_TAG,
      allowedSchs: Model.tops,
      n: 1
    }
  },
}

const structSheet = {
  [s(Core).t]: Core.structSheet,
  [s(Model).t]: Model.structSheet,
}

const maybeStandAlone = (store, conf) => {
  if (!store) {
    store = Core.putAnchor(() => Object.assign(({ t: "model_ext", m: "proj", fields: [], tag: "file" })))
    Object.assign(structSheet, { ["proj"]: { sheet, toStr: {} } })
  }

  store.structSheet ||= conf.structSheet || {}
  Object.assign(store.structSheet, structSheet)

  return store
}

const { Selects } = Actions
const FmodelTree = (conf = {}, store) => {
  let { target } = conf
  document.querySelector(target).setAttribute("data-ext", "fmodel")

  store = maybeStandAlone(store, conf)
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
      ["Escape", ({ tree }) => AriaTree.clearClipboard(tree)]
    ],
    textAreaKeyDownCmd: [
      ["Enter", Actions.submitEdit],
      ["Escape", Actions.escapeEdit]
    ],
    dblClickCmd: Actions.activateEditType,

    view: (s) => renderRoot(target, s || store, {
      ui: {
        lineClass: "setnu",
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


const ReadOnlyFmodelTree = (conf = {}, store) => {
  let { target, select, focus = false } = conf
  document.querySelector(target).setAttribute("data-ext", "fmodel")

  store = maybeStandAlone(store, conf)
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
