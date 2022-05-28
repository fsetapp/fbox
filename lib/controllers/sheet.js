import * as SH from "../actions/sheet.js"
import { anchorsModels } from "../repo/store/indice.js"
import { readable } from "../utils.js"
import { TOPLV_TAG } from "../pkgs/core.js"

export { controller }

const S = A.Selects

const controller = (projectStore, { tree, target, command }) => {
  let fileStore = target.closest("[data-tag='file']")?.sch

  switch (target.dataset.tag) {

    case TOPLV_TAG:
      switch (command) {
        case SH.submitEdit:
          readable(fileStore, "_models", anchorsModels(projectStore))
          fileStore.render()
      }
      break
  }
}
