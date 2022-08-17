import * as Sch from "../sch.js"
import { readable, autoResize } from "../utils.js"
import { renderMeta, renderBlankMeta } from "../views/model/docs_view.js"
import { define } from "./define.js"
import * as SchMeta from "../actions/sch_meta.js"
import { anchorsModels } from "../repo/store/indice.js"

export const blankSchMetaForm = (target) => renderBlankMeta(target)

export const ModelMetaForm = ({ tree, store, target, sch, ui }) => {
  let schMetaEl = document.querySelector(target)
  if (!schMetaEl) return

  const renderSchMeta = sch => {
    let top = sch._meta.lpath.find(a => a.tag == "top_lv")
    let file = sch._meta.lpath.find(a => a.tag == "file")
    let fileStore = Sch.get(store, (a, m) => a.$a == file.$a)

    readable(fileStore, "_models", anchorsModels(store))
    readable(fileStore, "_indices", store._indices)

    if (top) {
      let parent = Sch.get(fileStore, (a, m) => a.$a == top.$a)
      renderMeta(target, parent, sch, fileStore, ui)
    }

    for (let textarea of schMetaEl.querySelectorAll("textarea"))
      autoResize({ target: textarea })
    // let active = schMetaEl.querySelector("[data-active='true']")
    // active.scrollIntoView({ block: "start" })
  }

  const view = { renderSchMeta }
  view.renderSchMeta(sch)

  let context = { store, tree, scope: schMetaEl, view }
  const clickCmds = [
    ["edit", SchMeta.edit],
    ["cancel", SchMeta.show]
  ]
  const domEvents = [
    ["change", SchMeta.inputChange],
    ["input", SchMeta.inputChange],
    ["paste", SchMeta.inputChange],
    ["focusout", SchMeta.inputChange],
    ["click", clickCmds],
    ["submit", SchMeta.formSubmit]
  ]

  define(schMetaEl.tagName.toLowerCase(), context, domEvents)
}
