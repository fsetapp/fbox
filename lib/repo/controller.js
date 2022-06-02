import { save as saveSchMeta } from "../sch/meta.js"
import { update as updateSch } from "../sch.js"
import { controller as sharedController } from "../controllers/file_body.js"

export const router = (projectStore, event) => {
  const bodyExt = event.target.closest("[data-ext]").dataset.ext
  const controller = projectStore.controllers[bodyExt]
  if (!controller) return

  sharedController(projectStore, event)
  controller(projectStore, event)
}

export const SchMeta = {
  update: ({ store, detail }) => {
    let { path, attrs } = detail
    let sch = updateSch(store, path, (a, m) => saveSchMeta(a, attrs))

    if (sch) {
      if (store.render) store.render(store)
      if (store.renderSchMeta) store.renderSchMeta(store)
    }

    return sch
  }
}
