import * as A from "../actions.js"
import { anchorsModels } from "../repo/store/indice.js"
import { walkTops } from "../repo/walk.js"
import { readable } from "../utils.js"
import { FILE_TAG } from "../pkgs/proj.js"
import { TOPLV_TAG } from "../pkgs/core.js"
import { walk as walkSelectable } from "../aria_tree.js"
export { controller, diffableActs }

const controller = (projectStore, { tree, target, command }) => {
  let fileStore = target.closest("[data-tag='file']")?.sch
  walkSelectable(tree, ({ node, selected }) => readable(node.sch, "selected", selected))

  switch (target.dataset.tag) {
    case FILE_TAG:
      switch (command) {
        case A.addSch:
        case A.deleteSelected:
        case A.paste:
          readable(fileStore, "_models", anchorsModels(projectStore))
          projectStore.render()
          break
      }
      break
    case TOPLV_TAG:
      switch (command) {
        case A.markAsEntry:
          unmarkEntriesExcept(target, projectStore)
          fileStore.render()
          break
        case A.deleteSelected:
          readable(fileStore, "_models", anchorsModels(projectStore))
          projectStore.render()
          break
        case A.cloneUp:
        case A.cloneDown:
          unmarkEntriesExcept(target, projectStore)
          readable(fileStore, "_models", anchorsModels(projectStore))
          fileStore.render()
          projectStore.render()
          break
        case A.submitEdit:
          readable(fileStore, "_models", anchorsModels(projectStore))
          fileStore.render()
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
