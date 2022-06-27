import { save as saveSchMeta } from "../pkgs/model/meta.js"
import { update as updateSch } from "../sch.js"
import { SchMetaForm } from "../elements/model_meta.js"

export const controller = (projectStore, { tree, target, command }) => {
  let fileStore = target.closest("[data-tag='file']")?.sch
  SchMetaForm({ store: fileStore, target: "#fsch", treeTarget: "file-body" })
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
