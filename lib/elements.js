import * as Actions from "./actions.js"
import * as AriaTree from "./aria_tree.js"

import { TreeComponent } from "./components/tree_component.js"
import { renderRoot } from "./views/tree_view.js"

import * as Sch from "./sch.js"
import { renderMeta } from "./views/sch_meta_view.js"

export const ProjectTree = ({ store, target }) => {
  TreeComponent({
    store,
    target,
    treeKeyDownCmds: [
      ["shift-meta-ArrowUp", Actions.selectMultiNodeUpTo],
      ["shift-meta-ArrowDown", Actions.selectMultiNodeDownTo],
      ["shift-ArrowUp", Actions.selectMultiNodeUp],
      ["shift-ArrowDown", Actions.selectMultiNodeDown],
      ["meta-ArrowUp", Actions.selectUpEnd],
      ["meta-ArrowDown", Actions.selectDownEnd],
      ["ArrowUp", Actions.selectUp],
      ["ArrowDown", Actions.selectDown],
      ["Home", Actions.selectRoot],
      ["End", Actions.selectLast],

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
      ["Enter", Actions.submitEdit]
    ],
    view: (s) => renderRoot(target, s || store, {
      ui: {
        depthLimit: 2,
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
      focus: true
    }
  })
}

export const FmodelTree = ({ store, target }) => {
  TreeComponent({
    store,
    target,
    treeKeyDownCmds: [
      ["shift-meta-ArrowUp", Actions.selectMultiNodeUpTo],
      ["shift-meta-ArrowDown", Actions.selectMultiNodeDownTo],
      ["shift-ArrowUp", Actions.selectMultiNodeUp],
      ["shift-ArrowDown", Actions.selectMultiNodeDown],
      ["meta-ArrowUp", Actions.selectUpEnd],
      ["meta-ArrowDown", Actions.selectDownEnd],
      ["ArrowUp", Actions.selectUp],
      ["ArrowDown", Actions.selectDown],
      ["Home", Actions.selectRoot],
      ["End", Actions.selectLast],

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

      ["Escape", ({ tree }) => AriaTree.clearClipboard(tree)],
    ],
    textAreaKeyDownCmd: [
      ["Enter", Actions.submitEdit]
    ],
    view: (s) => renderRoot(target, s || store, {
      ui: { modelTypeText: (sch, ui) => sch.isEntry ? "entrypoint" : "type" }
    })
  })
}

export const SchMetaForm = ({ store, target, treeTarget }) => {
  let metaForm = document.querySelector(target)
  let tree = document.querySelector(`${treeTarget} [role='tree']`)
  if (!metaForm || !tree) return

  const renderSchMeta = ({ tree, store }) => {
    let selected = tree.querySelectorAll("[role='treeitem'][aria-selected='true']")
    if (selected.length == 1) {
      let sch = Sch.get(store, selected[0].id)
      sch.path = selected[0].id
      sch.rootKey = tree.querySelector(".root-item").key
      sch.metadata = store.schMetas[sch.$anchor]

      renderMeta(metaForm, sch, store)
    }
  }
  tree._renderSchMeta = (s) => renderSchMeta({ tree, store: s || store })
  tree._renderSchMeta()
  store.renderSchMeta = function (s) { tree._renderSchMeta(s || this) }
}
