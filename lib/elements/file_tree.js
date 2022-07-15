import * as Core from "../pkgs/core.js"
import * as Proj from "../pkgs/proj.js"
import { s } from "../pkgs/registry.js"

import * as A from "../actions.js"
const S = A.Selects

import { TreeComponent } from "../components/tree_component.js"
import { view } from "../views/files_view.js"
import { controller as controller_, changeFile } from "../controllers/project.js"
export { FileTree, changeFile, structSheet, controller }

const extstr = "project"
const controller = { [extstr]: controller_ }
const structSheet = {
  [s(Core).t]: Core.structSheet,
  [s(Proj).t]: Proj.structSheet,
}

const FileTree = (conf = {}, store) => {
  let { target, select, focus = true, ...passthrough } = conf
  store.structSheet ||= structSheet

  document.querySelector(target).setAttribute("data-ext", extstr)
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
      ["ArrowDown", S.selectDown],
      ["k", S.selectUp],
      ["j", S.selectDown],
      ["Home", S.selectRoot],
      ["End", S.selectLast],

      ["shift-+", A.addSch],
      ["Enter", A.activateEditKey],
      ["Delete", A.deleteSelected],

      ["meta-x", A.cut],
      ["meta-v", A.paste],

      ["ArrowRight", A.expandSelected],
      ["ArrowLeft", A.collapseSelected],
      ["Escape", A.clearClipboard]
    ],
    textAreaKeyDownCmd: [
      ["Enter", A.submitEdit],
      ["Escape", A.escapeEdit]
    ],
    domEvents: [
      ["click", [
        ["__pre__", S.clickSelect],
        ["add-file", A.addFile],
        ["add-folder", A.addFolder]
      ]]
    ],
    view: (s) => view(target, s || store, {
      ui: {
        tab: 0,
        modelTypeText: (sch, ui) => "",
        viewTypeTop: (a) => ``
      }
    }),
    opts: {
      passthrough,
      focus: focus,
      selectId: select
    }
  })
}
