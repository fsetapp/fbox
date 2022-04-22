import { renderBlankTree } from "./views/model_view.js"
import { renderMeta, renderBlankMeta } from "./views/sch_meta_view.js"

import * as Sch from "./sch.js"
import { readable } from "./utils.js"

export { FileTree } from "./elements/file_tree.js"
export { FmodelTree, ReadOnlyFmodelTree } from "./elements/fmodel_tree.js"
export { DataTree } from "./elements/data_tree.js"
export { HTMLTree } from "./elements/html_tree.js"

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
