import * as Sch from "../sch.js"
import * as M from "../pkgs/model.js"
import * as S from "../pkgs/sheet.js"
import { putAnchor, ref } from "../pkgs/core.js"
import {
  submitEdit as submitEdit_,
  editSelected as editSelected_,
} from "../actions.js"


export const newItem = ({ tree, store, e }) => {
  const parentSch = e.target.closest("[role=treeitem]").sch

  // switch (true) {
  //   case Sch.is(parentSch, M.list()):
  //     Sch.put(store, (a, m) => a.$a == dataSch.$a, [{ k: null, sch: () => Sch.clone(parentSch.sch), index: Number.MAX_SAFE_INTEGER }])
  //     break
  //   case Sch.is(parentSch, M.dict()):
  //     Sch.put(store, (a, m) => a.$a == dataSch.$a, [{ k: null, sch: () => Sch.clone(parentSch.sch), index: Number.MAX_SAFE_INTEGER }])
  //     break
  // }

  // tree._render(store)
}

export const nextPage = ({ tree, store, e }) => {
  const refSch = e.target.closest("[role=treeitem]").sch
  const top = store._models[refSch.$r]

  if (top) {
    let ctor = Sch.clone(top.sch)
    Sch.walk(ctor, (a, m) => {
      switch (true) {
        case Sch.is(a, M.erecord()):
          let extended = Sch.clone(store._models[a.schs[0].$r].sch)
          extended.fields.push(...a.schs[1].fields)
          a.fields = extended.fields
      }

      return a
    })

    Sch.changeT(store, (a, m) => a.$a == refSch.$a, () => ctor, { force: true })
  }
  tree._render(store)
}

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
          extended.fields.push(...a.schs[1].fields)
          a.fields = extended.fields
          break
        // case Sch.is(a, M.list()):
        //   a = S.data({ schs: [a.sch] })
        //   break
      }

      return a
    })
    dataSch.schs[0] = putAnchor(() => ref(anchor))
    if (!dataSch.schs[1])
      Sch.put(store, (a, m) => a.$a == dataSch.$a, [{ k: null, sch: () => ctor, index: 1 }])
    else
      // should create diff
      Sch.changeT(store, (a, m) => a.$a == dataSch.schs[1].$a, () => ctor, { force: true })
  }
  return tree._walker.currentNode.id
}
