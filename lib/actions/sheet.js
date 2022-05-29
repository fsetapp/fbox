import * as Core from "../pkgs/core.js"
import * as Sch from "../sch.js"
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
  const dataitem = textArea._treeItem.parentNode.closest("[role=treeitem]").sch
  dataitem.$r = anchor
  if (top) {
    Sch.walk(top, (a, m) => {
      console.log(a)
      return a
    })
    Sch.changeT(store, textArea._treeItem.id, () => Sch.clone(top.sch))
  }
  return tree._walker.currentNode.id
}
