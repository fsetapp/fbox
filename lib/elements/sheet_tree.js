import * as P from "../pkgs/proj.js"
import * as Core from "../pkgs/core.js"
import * as Sheet from "../pkgs/sheet.js"
import { s } from "../pkgs/registry.js"
import { maybeStandAlone } from "./standalone_helper.js"

import * as A from "../actions.js"
const S = A.Selects

import * as SH from "../actions/sheet.js"
import { TreeComponent } from "../components/tree_component.js"
import { renderRoot } from "../views/sheet_view.js"
import { controller as controller_, diffableActs as diffableActs_ } from "../controllers/sheet.js"

export { elements, controller, diffableActs, deps, Sheet as module }

const extt = Sheet.MODULE
const extstr = Sheet.PKG_NAME

const controller = { [extstr]: controller_ }
const diffableActs = { [extstr]: diffableActs_ }

const deps = {
  [s(Core).t]: Core.structSheet,
  [s(Sheet).t]: Sheet.structSheet
}

const SheetTree = (conf = {}, store) => {
  let { target } = conf
  document.querySelector(target).setAttribute("data-ext", extstr)

  const textAreaKeyDownCmds = {
    kbd: [
      ["Enter", SH.submitEdit],
      ["Escape", A.escapeEdit],
    ]
  }
  const inputKeyDownCmds = {
    kbd: [
      ["Escape", A.clearClipboard],
      ["ArrowUp", S.selectUp],
      ["ArrowDown", S.selectDown],
    ]
  }
  const treeKeyDownCmds = [
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
    ["Escape", A.clearClipboard]
  ]

  const renderSheet = s => renderRoot(target, s, {
    ui: {
      tab: 1
    }
  })

  TreeComponent({
    store,
    target,
    domEvents: [
      ["keydown", {
        pre: S.preventDefaultScroll,
        kbd: treeKeyDownCmds,
        selector: [
          ["input", inputKeyDownCmds],
          ["textarea", textAreaKeyDownCmds]
        ]
      }],
      ["focusin", SH.validate],
      ["input", SH.validate],
      ["click", {
        pre: S.clickSelect,
        selector: [
          ["[data-cmd='add-data']", A.addDataCtor],
          ["[data-cmd='next-page']", SH.nextPage],
          ["[data-cmd='new-item']", SH.newItem],
          ["[data-cmd='toggle']", A.toggleExpandCollapse]
        ]
      }],
      ["dblclick", () => { }]
    ],

    view: { render: renderSheet },
    opts: {
      focus: conf.focus,
      selectId: conf.select
    }
  })
}

const elements = { [extt]: { body: SheetTree } }
