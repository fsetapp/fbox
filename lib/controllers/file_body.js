import * as A from "../actions.js"
import { anchorsModels } from "../repo/store/indice.js"
import { walkTops } from "../repo/walk.js"
import { readable } from "../utils.js"
import { FILE_TAG } from "../pkgs/proj.js"
import { TOPLV_TAG } from "../pkgs/core.js"
import { walkSelectable } from "../aria_tree.js"
import { renderFileNav } from "../pkgs/file/index.js"
export { controller, diffableActs }

const renderFileNav_ = store => renderFileNav("[data-ext='project']", store)

const controller = (projectStore, { tree, store, target, command }) => {
  let fileStore = target.closest("[data-tag='file']")?.sch
  walkSelectable(tree, ({ n, selected, expanded }) => {
    n.sch.selected = selected
    n.sch.expanded = expanded
    return n.sch
  })
  store.currentNode = target

  switch (target.dataset.tag) {
    case FILE_TAG:
      switch (command) {
        case A.addSch:
        case A.deleteSelected:
        case A.paste:
          readable(fileStore, "_models", anchorsModels(projectStore))
          renderFileNav_(projectStore)
          break
      }
      break
    case TOPLV_TAG:
      switch (command) {
        case A.markAsEntry:
          unmarkEntriesExcept(target, projectStore)
          tree._render(fileStore)
          break
        case A.deleteSelected:
          readable(fileStore, "_models", anchorsModels(projectStore))
          renderFileNav_(projectStore)
          break
        case A.cloneUp:
        case A.cloneDown:
          unmarkEntriesExcept(target, projectStore)
          readable(fileStore, "_models", anchorsModels(projectStore))
          tree._render(fileStore)
          renderFileNav_(projectStore)
          break
        case A.submitEdit:
          readable(fileStore, "_models", anchorsModels(projectStore))
          tree._render(fileStore)
      }
      break
  }
}

const diffableActs = [
  A.addSch, A.addFile, A.addFolder, A.deleteSelected, A.submitEdit, A.paste,
  A.cloneUp, A.cloneDown, A.reorderUp, A.reorderDown,
  A.deleteSelected, A.markAsEntry
].map(cmd => cmd.name)

const unmarkEntriesExcept = (target, projectStore) => {
  // Only store the latest entrypoint, and delete all previous ones
  // We only allow one entry point for now
  if (target.dataset.tag == TOPLV_TAG) {
    walkTops(projectStore, (fmodel, m) => {
      if (fmodel.$a != target.sch.$a && fmodel.isEntry)
        delete fmodel.isEntry
      return fmodel
    })
  }
}
