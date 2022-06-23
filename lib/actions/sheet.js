import * as Sch from "../sch.js"
import * as M from "../pkgs/model.js"
import * as S from "../pkgs/sheet.js"
import { putAnchor, ref } from "../pkgs/core.js"
import {
  submitEdit as submitEdit_,
  editSelected as editSelected_,
} from "../actions.js"
import { readable, forEach } from "../utils.js"
import * as AriaTree from "../aria_tree.js"


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
  let assigns = e.target._assigns
  const refItem = e.target.closest("[role=treeitem]")
  let dataSch = refItem.parentElement.closest("[role=treeitem]")?.sch
  const refSch = refItem.sch
  const top = store._models[refSch.$r]

  dataSch = Sch.get(store, (a, m) => a.$a == dataSch.$a)

  if (top) {
    let ctor = mapToCtor(store, top)
    assigns.sch = ctor

    if (!dataSch.schs[1])
      Sch.put(store, (a, m) => a.$a == dataSch.$a, [{ k: null, sch: () => ctor, index: 1 }])
    else
      Sch.changeT(store, (a, m) => a.$a == dataSch.schs[1].$a, () => ctor, { force: true })

    for (let [$a, assigns_] of Object.entries(store._columns)) {
      if (assigns_.ui.columnIndex > assigns.ui.columnIndex + 1)
        delete store._columns[$a]
    }
    store._columns[assigns.sch.$a] = assigns
    tree._render(store)
    AriaTree.selectNode(tree, refItem)
  }
}

export const submitEdit = ({ tree, store }, textArea) => {
  if (textArea.id == "call-ctor")
    editSelected_(tree, store, textArea, createCtor)
  else
    submitEdit_({ tree, store }, textArea)
}

export const validate = ({ tree, store, e }) => {
  if (!(e.target instanceof HTMLInputElement)) return

  const item = e.target.closest("[role=treeitem]")
  const { toVal } = store.structSheet[item.sch.m]
  AriaTree.selectNode(tree, item, { focus: false })

  let val = toVal(item.sch, e.target.value)
  if (!val)
    item.sch.errors = []
  else
    item.sch.v = val.v
}

const createCtor = (tree, store, textArea) => {
  let anchor = Object.keys(store._models || {}).find(anchor => store._models[anchor].display == textArea.value)
  const top = store._models[anchor]
  const dataSch = textArea._treeItem.parentNode.closest("[role=treeitem]").sch

  if (top) {
    let ctor = mapToCtor(store, top)
    delete ctor.tag

    dataSch.schs[0] = putAnchor(() => ref(anchor))
    if (!dataSch.schs[1])
      Sch.put(store, (a, m) => a.$a == dataSch.$a, [{ k: null, sch: () => ctor, index: 1 }])
    else
      // should create diff
      Sch.changeT(store, (a, m) => a.$a == dataSch.schs[1].$a, () => ctor, { force: true })
  }
  return tree._walker.currentNode.id
}

const mapToCtor = (store, top) =>
  Sch.clone(top.sch, (a, m) => {
    const s = S.data()

    switch (true) {
      case Sch.is(a, M.record()): break
      case Sch.is(a, M.tuple()): break
      case Sch.is(a, M.union()): break
      case Sch.is(a, M.taggedUnion()): break
      case Sch.is(a, M.erecord()):
        let extended = Sch.clone(store._models[a.schs[0].$r].sch)
        extended.fields.push(...a.schs[1].fields)
        a.fields = extended.fields
        break
      case Sch.is(a, M.list()):
        delete a.sch
        a.schs = []
        break
      case Sch.is(a, M.dict()):
        a.schs = []
        break
      case !Sch.is(m.parent, S.data()) && Sch.is(a, ref()):
        a = putAnchor(() => S.data({ key: a.key, schs: [a] }))
        break
    }

    if (!Sch.is(a, ref())) {
      a.$r = a.$a
      a.m = s.m
    }

    return a
  })
