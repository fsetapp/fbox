import * as Actions from "./actions.js"
import * as AriaTree from "./aria_tree.js"

import { TreeComponent } from "./components/tree_component.js"
import { renderRoot, renderBlankTree } from "./views/tree_view.js"
import { renderFiles } from "./views/files_view.js"
import { renderMeta, renderBlankMeta } from "./views/sch_meta_view.js"

import * as Sch from "./sch.js"
import { readable } from "./utils.js"

const { selectMultiNodeUpTo,
  selectMultiNodeDownTo,
  selectMultiNodeUp,
  selectMultiNodeDown,
  selectUpEnd,
  selectDownEnd,
  selectUp,
  selectDown,
  selectPrevious,
  selectNext,
  selectRoot,
  selectLast } = Actions.Selects

export const ProjectTree = ({ store, target, select, focus = true }) => {
  TreeComponent({
    store,
    target,
    treeKeyDownCmds: [
      ["shift-meta-ArrowUp", selectMultiNodeUpTo],
      ["shift-meta-ArrowDown", selectMultiNodeDownTo],
      ["shift-ArrowUp", selectMultiNodeUp],
      ["shift-ArrowDown", selectMultiNodeDown],
      ["meta-ArrowUp", selectUpEnd],
      ["meta-ArrowDown", selectDownEnd],
      ["ArrowUp", selectUp],
      ["ArrowDown", selectDown],
      ["Home", selectRoot],
      ["End", selectLast],

      ["shift-+", Actions.addSch],
      ["Enter", Actions.activateEditKey],
      ["Delete", Actions.deleteSelected],

      ["meta-v", Actions.paste],
      // Allowing cloning files will allow cloning the whole project which is not
      // What we want currently
      //
      // ["shift-alt-ArrowUp", Actions.cloneUp],
      // ["shift-alt-ArrowDown", Actions.cloneDown],
      ["alt-ArrowUp", Actions.reorderUp],
      ["alt-ArrowDown", Actions.reorderDown]
    ],
    textAreaKeyDownCmd: [
      ["Enter", Actions.submitEdit],
      ["Escape", Actions.escapeEdit]
    ],
    view: (s) => renderRoot(target, s || store, {
      ui: {
        depthLimit: 2,
        tab: 0,
        modelTypeText: (sch, ui) => "modu",
        typeText: (sch, ui) => {
          if (sch.t == T.RECORD) return "record"
          else if (sch.t == T.VALUE) return "value"
          else if (sch.t == T.TUPLE) return "tuple"
          else if (sch.t == T.UNION) return "union"
        },
        viewTypeTop: (a) => ``
      }
    }),
    opts: {
      focus: focus,
      selectId: select
    }
  })
}

export const FileTree = ({ store, target, select, focus = true }) => {
  TreeComponent({
    store,
    target,
    treeKeyDownCmds: [
      ["shift-meta-ArrowUp", selectMultiNodeUpTo],
      ["shift-meta-ArrowDown", selectMultiNodeDownTo],
      ["shift-ArrowUp", selectMultiNodeUp],
      ["shift-ArrowDown", selectMultiNodeDown],
      ["meta-ArrowUp", selectUpEnd],
      ["meta-ArrowDown", selectDownEnd],
      ["ArrowUp", selectUp],
      ["ArrowDown", selectDown],
      ["Home", selectRoot],
      ["End", selectLast],

      ["shift-+", Actions.addSch],
      ["Enter", Actions.activateEditKey],
      ["Delete", Actions.deleteSelected],

      ["meta-v", Actions.paste],
      // Allowing cloning files will allow cloning the whole project which is not
      // What we want currently
      //
      // ["shift-alt-ArrowUp", Actions.cloneUp],
      // ["shift-alt-ArrowDown", Actions.cloneDown],
      ["alt-ArrowUp", Actions.reorderUp],
      ["alt-ArrowDown", Actions.reorderDown],
      ["ArrowRight", Actions.expandSelected],
      ["ArrowLeft", Actions.collapseSelected],
    ],
    textAreaKeyDownCmd: [
      ["Enter", Actions.submitEdit],
      ["Escape", Actions.escapeEdit]
    ],
    view: (s) => renderFiles(target, s || store, {
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


export const FmodelTree = (conf = {}) => {
  let { store, target } = conf

  TreeComponent({
    store,
    target,
    treeKeyDownCmds: [
      ["shift-meta-ArrowUp", selectMultiNodeUpTo],
      ["shift-meta-ArrowDown", selectMultiNodeDownTo],
      ["shift-ArrowUp", selectMultiNodeUp],
      ["shift-ArrowDown", selectMultiNodeDown],
      ["meta-ArrowUp", selectUpEnd],
      ["meta-ArrowDown", selectDownEnd],
      ["ArrowUp", selectUp],
      ["ArrowDown", selectDown],
      ["k", selectPrevious],
      ["j", selectNext],
      ["Home", selectRoot],
      ["End", selectLast],

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

export const rFmodelTree = ({ store, target, select, focus = false }) => {
  TreeComponent({
    store,
    target,
    treeKeyDownCmds: [
      ["ArrowUp", selectUp],
      ["ArrowDown", selectDown],
      ["ArrowRight", Actions.expandSelected],
      ["ArrowLeft", Actions.collapseSelected],
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

export const SchMetaForm = ({ store, target, treeTarget }) => {
  let metaForm = document.querySelector(target)
  let tree = document.querySelector(`${treeTarget} [role='tree']`)
  if (!metaForm || !tree) return

  readable(store, "renderSchMeta", function (s) {
    renderSchMeta({ tree, store: s || this, metaForm: target })
  })
  store.renderSchMeta()
}
const renderSchMeta = ({ tree, store, metaForm }) => {
  let selected = tree.querySelectorAll("[role='treeitem'][aria-selected='true']")
  if (selected.length == 1) {
    let sch = Sch.get(store, selected[0].id)

    if (sch) {
      renderMeta(metaForm, sch, store)
    }
  }
}

export const blankTree = (target) => renderBlankTree(target)
export const blankSchMetaForm = (target) => renderBlankMeta(target)
