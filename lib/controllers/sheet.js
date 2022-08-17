import * as SH from "../actions/sheet.js"
import { anchorsModels } from "../repo/store/indice.js"
import { readable } from "../utils.js"
import { TOPLV_TAG } from "../pkgs/core.js"
import { ModelMetaForm } from "../elements/model_meta_form.js"
import * as Sch from "../sch.js"

export { controller, diffableActs }

const controller = (projectStore, { tree, target, command }) => {
  let fileStore = target.closest("[data-tag='file']")?.sch
  let child = Sch.get(projectStore, (a, m) => a.$a == target.sch.$r)
  const { selected, expanded } = target.sch

  if (child)
    ModelMetaForm({ store: projectStore, tree, target: "#fsch", sch: child, ui: { selected, expanded } })

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

const diffableActs = [
  SH.submitEdit
].map(cmd => cmd.name)
