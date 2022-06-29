import * as Sch from "../sch.js"
import { readable } from "../utils.js"
import { renderMeta, renderBlankMeta } from "../views/sch_meta_view.js"

export const blankSchMetaForm = (target) => renderBlankMeta(target)

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
    let top = selected[0].closest("[role='treeitem'][data-tag='top_lv']")
    if (!top) return

    let parent = Sch.get(store, top.id)
    let child = Sch.get(store, selected[0].id)

    if (parent)
      renderMeta(metaForm, parent, child, store)
  }
}
