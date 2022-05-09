import * as A from "../actions.js"

import { save as saveSchMeta } from "../sch/meta.js"
import { update as updateSch } from "../sch.js"

export const router = (projectStore, event) => {
  const bodyExt = event.target.closest("[data-ext]").dataset.ext
  const controller = projectStore.controllers[bodyExt]
  if (!controller) return

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

export const isDiffableCmd = (cmdname) => [
  A.addSch, A.addFile, A.addFolder, A.deleteSelected, A.submitEdit, A.paste,
  A.cloneUp, A.cloneDown, A.reorderUp, A.reorderDown,
  A.deleteSelected, A.markAsEntry
].map(cmd => cmd.name).includes(cmdname)
