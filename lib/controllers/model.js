import { ModelMetaForm } from "../elements/model_meta_form.js"
import * as Sch from "../sch.js"

export const controller = (projectStore, { tree, target, command }) => {
  let top = target.closest("[data-tag='top_lv']")?.sch
  let file = target.closest("[data-tag='file']").sch
  ModelMetaForm({ store: projectStore, tree, target: "#fsch", file, top, sch: target.sch, ui: {} })
}
