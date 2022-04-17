import * as Actions from "../actions.js"
import * as AriaTree from "../aria_tree.js"

import { TreeComponent } from "../components/tree_component.js"
import { view } from "../views/files_view.js"
const { Selects } = Actions

export const FileTree = ({ store, target, select, focus = true }) => {
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
      ["Delete", Actions.deleteSelected],

      ["meta-x", Actions.cut],
      ["meta-v", Actions.paste],

      ["ArrowRight", Actions.expandSelected],
      ["ArrowLeft", Actions.collapseSelected],
      ["Escape", ({ tree }) => AriaTree.clearClipboard(tree)]
    ],
    textAreaKeyDownCmd: [
      ["Enter", Actions.submitEdit],
      ["Escape", Actions.escapeEdit]
    ],
    clickCmds: [
      ["add-file", Actions.addFile],
      ["add-folder", Actions.addFolder]
    ],
    view: (s) => view(target, s || store, {
      ui: {
        tab: 0,
        modelTypeText: (sch, ui) => "",
        viewTypeTop: (a) => ``
      }
    }),
    opts: {
      focus: focus,
      selectId: select
    }
  })
}
