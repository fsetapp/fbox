import * as P from "../pkgs/proj.js"
import * as Core from "../pkgs/core.js"
import * as Sheet from "../pkgs/sheet.js"
import { s } from "../pkgs/registry.js"
import { maybeStandAlone } from "./standalone_helper.js"

import * as Actions from "../actions.js"
import { TreeComponent } from "../components/tree_component.js"
import { renderRoot } from "../views/sheet_view.js"

export { elements, controller, structSheet, sheet as topSheet }

const extt = P.SHEET_EXT
const extstr = P.structSheet.toStr[P.SHEET_EXT]

const controller = {}
const sheet = {
  [extt]: {
    self: {
      exceptActions: [Actions.addFile, Actions.addFolder]
    },
    children: {
      tag: Core.TOPLV_TAG, // required
      allowedSchs: Sheet.tops
    }
  }
}

const structSheet = {
  [s(Core).t]: Core.structSheet,
  [s(Sheet).t]: Sheet.structSheet
}

const { Selects } = Actions
const SheetTree = (conf = {}, store) => {
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
      ["ArrowLeft", Selects.selectUp],
      ["ArrowDown", Selects.selectDown],
      ["ArrowRight", Selects.selectDown],
      ["k", Selects.selectPrevious],
      ["j", Selects.selectNext],
      ["Home", Selects.selectRoot],
      ["End", Selects.selectLast],

      ["shift-+", Actions.addSch],
      ["Enter", Actions.activateEditText],
      ["shift-Enter", Actions.insertBlank],
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
      ["alt-ArrowLeft", Actions.unwrapAfter],
      ["alt-ArrowRight", Actions.wrapBefore],

      // ["ArrowRight", Actions.expandSelected],
      // ["ArrowLeft", Actions.collapseSelected],
      ["Escape", Actions.clearClipboard]
    ],
    textAreaKeyDownCmd: [
      ["Enter", Actions.submitEdit],
      ["Escape", Actions.escapeEdit]
    ],
    clickCmds: [
      ["add-section", Actions.addSection],
      ["add-form", Actions.addForm]
    ],
    dblClickCmd: () => { },

    view: (s) => renderRoot(target, s || store, {
      ui: {
        tab: 3
      }
    }),
    opts: {
      focus: conf.focus,
      selectId: conf.select
    }
  })
}

const elements = { [extt]: { body: SheetTree } }
