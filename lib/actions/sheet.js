import * as Sch from "../sch.js"
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

const createCtor = (tree, store, textArea) => {
  let anchor = store._models && Object.keys(store._models).find(anchor => {
    return store._models[anchor].display == textArea.value
  })
  const top = store._models[anchor]
  const dataSch = textArea._treeItem.parentNode.closest("[role=treeitem]").sch

  if (top) {
    let ctor = Sch.clone(top.sch)
    Sch.walk(ctor, (a, m) => {
      a.v = undefined
      return a
    })
    dataSch.schs[0] = putAnchor(() => ref(anchor))
    Sch.changeT(store, (a, m) => a.$a == dataSch.schs[1].$a, () => ctor, { force: true })
  }
  return tree._walker.currentNode.id
}
