import * as Sch from "../sch.js"
import { readable, autoResize } from "../utils.js"
import { renderMeta, renderBlankMeta } from "../views/sch_meta_view.js"
import { define } from "./define.js"
import * as SchMeta from "../actions/sch_meta.js"
import { anchorsModels } from "../repo/store/indice.js"

export const blankSchMetaForm = (target) => renderBlankMeta(target)

export const SchMetaForm = ({ tree, store, target, sch }) => {
  let schMetaEl = document.querySelector(target)
  if (!schMetaEl) return

  const view = sch => {
    let top = sch._meta.lpath.find(a => a.tag == "top_lv")
    let file = sch._meta.lpath.find(a => a.tag == "file")
    let fileStore = Sch.get(store, (a, m) => a.$a == file.$a)

    readable(fileStore, "_models", anchorsModels(store))

    if (top) {
      let parent = Sch.get(fileStore, (a, m) => a.$a == top.$a)
      renderMeta(target, parent, sch, fileStore)
    }

    for (let textarea of schMetaEl.querySelectorAll("textarea"))
      autoResize({ target: textarea })
    // let active = schMetaEl.querySelector("[data-active='true']")
    // active.scrollIntoView({ block: "start" })
  }

  readable(store, "renderSchMeta", view)
  store.renderSchMeta(sch)

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
