import * as M from "../pkgs/model.js"
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

const is = ({ m, t }, sch) => m == sch.m && t == sch.t
const createCtor = (tree, store, textArea) => {
  let anchor = store._models && Object.keys(store._models).find(anchor => {
    return store._models[anchor].display == textArea.value
  })
  const top = store._models[anchor]
  const dataitem = textArea._treeItem.parentNode.closest("[role=treeitem]").sch
  if (top) {
    let ctor = Sch.clone(top.sch)
    Sch.walk(ctor, (a, m) => {
      a.v = undefined
      return a
    })
    dataitem.schs[0].$r = anchor
    Sch.changeT(store, textArea._treeItem.id, () => ctor)
  }
  return tree._walker.currentNode.id
}
