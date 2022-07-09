import * as Sch from "../sch.js"
import { readable, autoResize } from "../utils.js"
import { renderMeta, renderBlankMeta } from "../views/sch_meta_view.js"
import { define } from "./define.js"
import * as SchMeta from "../actions/sch_meta.js"

export const blankSchMetaForm = (target) => renderBlankMeta(target)

export const SchMetaForm = ({ store, target, treeTarget }) => {
  let schMetaEl = document.querySelector(target)
  let tree = document.querySelector(`${treeTarget} [role='tree']`)
  if (!schMetaEl || !tree) return

  const view = function () {
    renderSchMeta({ tree, store: this, metaForm: target })
    for (let textarea of schMetaEl.querySelectorAll("textarea"))
      autoResize({ target: textarea })
    // let active = schMetaEl.querySelector("[data-active='true']")
    // active.scrollIntoView({ block: "start" })
  }

  readable(store, "renderSchMeta", view)
  store.renderSchMeta()

  let context = { store, tree, scope: schMetaEl }
  const clickCmds = [
    ["edit", SchMeta.edit]
  ]
  const domEvents = [
    ["change", SchMeta.update],
    ["input", SchMeta.update],
    ["paste", SchMeta.update],
    ["focusout", SchMeta.update],
    ["click", clickCmds],
    ["submit", SchMeta.save]
  ]

  define(schMetaEl.tagName.toLowerCase(), context, domEvents)
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
