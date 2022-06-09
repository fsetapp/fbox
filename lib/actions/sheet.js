import * as Sch from "../sch.js"
import * as M from "../pkgs/model.js"
import { putAnchor, ref } from "../pkgs/core.js"
import {
  submitEdit as submitEdit_,
  editSelected as editSelected_,
} from "../actions.js"

export const submitEdit = ({ tree, store }, textArea) => {
  if (textArea.id == "call-ctor")
    editSelected_(tree, store, textArea, createCtor)
  else
    submitEdit_({ tree, store }, textArea)
}

export const validate = ({ tree, store, e }) => {
  const item = e.target.closest("[role=treeitem]")
  const { toVal } = store.structSheet[item.sch.m]

  let val = toVal(item.sch, e.target.value)
  if (!val)
    item.sch.errors = []
  else
    item.sch.v = val.v
}

const createCtor = (tree, store, textArea) => {
  let anchor = store._models && Object.keys(store._models).find(anchor => {
    return store._models[anchor].display == textArea.value
  })
  const top = store._models[anchor]
  const dataSch = textArea._treeItem.parentNode.closest("[role=treeitem]").sch

  if (top) {
    let ctor = Sch.clone(top.sch)
    Sch.walk(ctor, (a, m) => {
      switch (true) {
        case Sch.is(a, M.erecord()):
          let extended = Sch.clone(store._models[a.schs[0].$r].sch)
          delete extended.tag
          extended.fields.push(...a.schs[1].fields)
          a = extended
      }

      return a
    })
    dataSch.schs[0] = putAnchor(() => ref(anchor))
    Sch.put(store, (a, m) => a.$a == dataSch.$a, [{ k: null, sch: () => ctor, index: 1 }])
  }
  return tree._walker.currentNode.id
}
