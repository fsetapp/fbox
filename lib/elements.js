import * as Actions from "./actions.js"
import * as AriaTree from "./aria_tree.js"

import { TreeComponent } from "./components/tree_component.js"
import { renderRoot } from "./views/tree_view.js"

import * as Sch from "./sch.js"
import { renderMeta } from "./views/sch_meta_view.js"

const { selectMultiNodeUpTo,
  selectMultiNodeDownTo,
  selectMultiNodeUp,
  selectMultiNodeDown,
  selectUpEnd,
  selectDownEnd,
  selectUp,
  selectDown,
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
      ["m", Actions.markAsEntry],

      ["meta-v", Actions.paste],
      ["shift-alt-ArrowUp", Actions.cloneUp],
      ["shift-alt-ArrowDown", Actions.cloneDown],
      ["alt-ArrowUp", Actions.reorderUp],
      ["alt-ArrowDown", Actions.reorderDown],

      ["Escape", ({ tree }) => AriaTree.clearClipboard(tree)]
    ],
    textAreaKeyDownCmd: [
      ["Enter", Actions.submitEdit],
      ["Escape", Actions.escapeEdit]
    ],
    view: (s) => renderRoot(target, s || store, {
      ui: {
        depthLimit: 2,
        tab: 0.25,
        modelTypeText: (sch, ui) => "file",
        typeText: (sch, ui) => {
          if (sch.type == T.RECORD) return "record"
          else if (sch.type == T.VALUE) return "value"
          else if (sch.type == T.TUPLE) return "tuple"
          else if (sch.type == T.UNION) return "union"
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

export const FmodelTree = ({ store, target, select, focus }) => {
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
      ["shift-Enter", Actions.activateEditType],
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
      ["Escape", ({ tree }) => AriaTree.clearClipboard(tree)],
    ],
    textAreaKeyDownCmd: [
      ["Enter", Actions.submitEdit],
      ["Escape", Actions.escapeEdit]
    ],
    view: (s) => renderRoot(target, s || store, {
      ui: {
        lineClass: "setnu",
        tab: 2,
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

  Object.defineProperty(store, "renderSchMeta", {
    value: function (s) { renderSchMeta({ tree, store: s || this, metaForm }) },
    configurable: true
  })
  store.renderSchMeta()
}
const renderSchMeta = ({ tree, store, metaForm }) => {
  let selected = tree.querySelectorAll("[role='treeitem'][aria-selected='true']")
  if (selected.length == 1) {
    let sch = Sch.get(store, selected[0].id)
    if (sch) {
      sch.path = selected[0].id
      sch.rootKey = tree.querySelector(".root-item").key
      sch.metadata = store.schMetas[sch.$anchor]

      renderMeta(metaForm, sch, store)
    }
  }
}
