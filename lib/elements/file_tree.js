import * as Core from "../pkgs/core.js"
import * as Proj from "../pkgs/proj.js"
import { s } from "../pkgs/registry.js"

import * as A from "../actions.js"
const S = A.Selects

import { TreeComponent } from "../components/tree_component.js"
import { view } from "../views/files_view.js"
import { controller as controller_, changeFile } from "../controllers/project.js"
export { FileTree, changeFile, controller }

const extstr = "project"
const controller = { [extstr]: controller_ }

export const renderFileNav = (target, s) => view(target, s, {
  ui: {
    tab: 0,
    modelTypeText: (sch, ui) => "",
    viewTypeTop: (a) => ``
  }
})

const FileTree = (conf = {}, store) => {
  let { target, select, focus = true, ...passthrough } = conf
  store.structSheet ||= structSheet
  document.querySelector(target).setAttribute("data-ext", extstr)

  const textAreaKeyDownCmd = {
    kbd: [
      ["Enter", A.submitEdit],
      ["Escape", A.escapeEdit]
    ]
  }
  const clickCmds = {
    pre: S.clickSelect,
    selector: [
      ["[data-cmd='add-file']", A.addFile],
      ["[data-cmd='add-folder']", A.addFolder]
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
    selector: [["textarea", textAreaKeyDownCmd]]
  }

  TreeComponent({
    store,
    target,
    domEvents: [
      ["click", clickCmds],
      ["keydown", keydownCmds]
    ],
    view: { render: s => renderFileNav(target, s) },
    opts: {
      passthrough,
      focus: focus,
      selectId: select,
      rendered: tree => { for (let i = 0; i < 2; i++) tree._walker.nextNode() }
    }
  })
}
