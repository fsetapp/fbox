import * as Core from "../pkgs/core.js"
import * as Html from "../pkgs/html.js"
import { s } from "../pkgs/registry.js"
import { maybeStandAlone } from "./standalone_helper.js"

import * as Actions from "../actions.js"
import * as AriaTree from "../aria_tree.js"

import { TreeComponent } from "../components/tree_component.js"
import { renderRoot } from "../views/html_view.js"

export { HTMLTree, structSheet }

const extt = "html_ext"
const sheet = t => lookup[t] || lookup["default"]
const lookup = {
  [extt]: {
    self: {
      exceptActions: [Actions.addFile, Actions.addFolder, Actions.paste]
    },
    children: {
      tag: Core.TOPLV_TAG, // required
      allowedSchs: Html.tops
    }
  }
}

const structSheet = {
  [s(Core).t]: Core.structSheet,
  [s(Html).t]: Html.structSheet
}

const { Selects } = Actions
const HTMLTree = (conf = {}) => {
  let { store, target } = conf
  document.querySelector(target).setAttribute("data-ext", "html")

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
      ["k", Selects.selectPrevious],
      ["j", Selects.selectNext],
      ["Home", Selects.selectRoot],
      ["End", Selects.selectLast],

      ["shift-+", Actions.addSch],
      ["Enter", Actions.activateEditText],
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
