import { SchMetaForm } from "../elements/model_meta.js"
import * as Sch from "../sch.js"

export const controller = (projectStore, { tree, target, command }) => {
  let fileStore = target.closest("[data-tag='file']")?.sch
  let child = Sch.get(projectStore, (a, m) => a.$a == target.sch.$a)

  SchMetaForm({ store: projectStore, tree, target: "#fsch", sch: child })
}
