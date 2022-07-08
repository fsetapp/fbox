import { SchMetaForm } from "../elements/model_meta.js"

export const controller = (projectStore, { tree, target, command }) => {
  let fileStore = target.closest("[data-tag='file']")?.sch
  SchMetaForm({ store: fileStore, target: "#fsch", treeTarget: "file-body" })
}
