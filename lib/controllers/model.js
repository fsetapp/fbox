import { ModelMetaForm } from "../elements/model_meta_form.js"
import * as Sch from "../sch.js"

export const controller = (projectStore, { tree, target, command }) => {
  ModelMetaForm({ store: projectStore, tree, target: "#fsch", sch: target.sch, ui: {} })
}
