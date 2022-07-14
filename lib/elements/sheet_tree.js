import * as P from "../pkgs/proj.js"
import * as Core from "../pkgs/core.js"
import * as Sheet from "../pkgs/sheet.js"
import { s } from "../pkgs/registry.js"
import { maybeStandAlone } from "./standalone_helper.js"

import * as A from "../actions.js"
import * as S from "../actions/select.js"
import * as SH from "../actions/sheet.js"
import { TreeComponent } from "../components/tree_component.js"
import { renderRoot } from "../views/sheet_view.js"
import { controller as controller_, diffableActs as diffableActs_ } from "../controllers/sheet.js"

export { elements, controller, diffableActs, structSheet, sheet as topSheet }

const extt = P.SHEET_EXT
const extstr = P.structSheet.toStr[P.SHEET_EXT]

const controller = { [extstr]: controller_ }
const diffableActs = { [extstr]: diffableActs_ }
const sheet = {
  [extt]: {
    self: {
      off: [A.addFile, A.addFolder]
    },
    children: {
      tag: Core.TOPLV_TAG, // required
      anyOf: Sheet.tops
    }
  }
}

const structSheet = {
  [s(Core).t]: Core.structSheet,
  [s(Sheet).t]: Sheet.structSheet
}

const SheetTree = (conf = {}, store) => {
  let { target } = conf
  document.querySelector(target).setAttribute("data-ext", extstr)

  store = maybeStandAlone(store, extt, { ...conf, structSheet, extSheet: sheet })
  TreeComponent({
    store,
    target,
    treeKeyDownCmds: [
      ["shift-meta-ArrowUp", S.selectMultiNodeUpTo],
      ["shift-meta-ArrowDown", S.selectMultiNodeDownTo],
      ["shift-ArrowUp", S.selectMultiNodeUp],
      ["shift-ArrowDown", S.selectMultiNodeDown],
      ["meta-ArrowUp", S.selectUpEnd],
      ["meta-ArrowDown", S.selectDownEnd],
      ["ArrowUp", S.selectUp],
      // ["ArrowLeft", S.selectUp],
      ["ArrowDown", S.selectDown],
      // ["ArrowRight", S.selectDown],
      ["k", S.selectPrevious],
      ["j", S.selectNext],
      ["Home", S.selectRoot],
      ["End", S.selectLast],

      ["shift-+", A.addSch],
      ["Enter", A.activateEditKey],
      // ["shift-Enter", A.insertAfter],
      ["t", A.activateEditType],
      ["Delete", A.deleteSelected],
      ["m", A.markAsEntry],

      ["meta-x", A.cut],
      ["meta-c", A.copy],
      ["meta-v", A.paste],
      ["shift-alt-ArrowUp", A.cloneUp],
      ["shift-alt-ArrowDown", A.cloneDown],
      ["alt-ArrowUp", A.reorderUp],
      ["alt-ArrowDown", A.reorderDown],
      ["alt-ArrowLeft", A.unwrapAfter],
      ["alt-ArrowRight", A.wrapBefore],

      ["ArrowRight", A.expandSelected],
      ["ArrowLeft", A.collapseSelected],
      ["Escape", A.clearClipboard],
      ["validate", SH.validate]
    ],
    textAreaKeyDownCmd: [
      ["Enter", SH.submitEdit],
      ["Escape", A.escapeEdit],
    ],
    inputKeyDownCmd: [
      ["Escape", A.clearClipboard],
      ["ArrowUp", S.selectUp],
      ["ArrowDown", S.selectDown],
    ],
    dblClickCmd: () => { },
    domEvents: [
      ["focusin", SH.validate],
      ["click", [
        ["__pre__", S.clickSelect],
        ["add-data", A.addDataCtor],
        ["next-page", SH.nextPage],
        ["new-item", SH.newItem],
        ["toggle", A.toggleExpandCollapse]
      ]]
    ],

    view: (s, opts) => renderRoot(target, s || store, Object.assign({
      ui: {
        tab: 1
      }
    }, opts)),
    opts: {
      focus: conf.focus,
      selectId: conf.select
    }
  })
}

const elements = { [extt]: { body: SheetTree } }
