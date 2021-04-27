import * as Sch from "./sch.js"
import * as T from "./sch/type.js"
import * as AriaTree from "./aria_tree.js"

export {
  selectMultiNodeUpTo,
  selectMultiNodeDownTo,
  selectMultiNodeUp,
  selectMultiNodeDown,
  selectUpEnd,
  selectDownEnd,
  selectUp,
  selectDown,
  selectRoot,
  selectLast,

  // Basic ops
  addSch,
  activateEditKey,
  activateEditType,
  deleteSelected,
  markAsEntry,

  // Intermediate ops
  cut,
  copy,
  paste,
  cloneUp,
  cloneDown,
  reorderUp,
  reorderDown,

  submitEdit,
  escapeEdit,
  clickSelect
}

/* Selection */

const selectMultiNodeUpTo = ({ tree }) => {
  let current = tree._walker.currentNode
  let upEnd = tree._walker.parentNode() && tree._walker.firstChild()
  AriaTree.selectMultiNodeTo(tree, current, upEnd)
}
const selectMultiNodeDownTo = ({ tree }) => {
  let current = tree._walker.currentNode
  let downEnd = tree._walker.parentNode() && tree._walker.lastChild()
  AriaTree.selectMultiNodeTo(tree, current, downEnd)
}
const selectMultiNodeUp = ({ tree }) => {
  let current = tree._walker.currentNode
  let upNext = tree._walker.previousSibling()
  AriaTree.selectMultiNode(current, upNext)
}
const selectMultiNodeDown = ({ tree }) => {
  let current = tree._walker.currentNode
  let downNext = tree._walker.nextSibling()
  AriaTree.selectMultiNode(current, downNext)
}
const selectUpEnd = ({ tree }) => {
  let upEnd = tree._walker.parentNode() && tree._walker.firstChild()
  AriaTree.selectNode(tree, upEnd)
}
const selectDownEnd = ({ tree }) => {
  let upEnd = tree._walker.parentNode() && tree._walker.lastChild()
  AriaTree.selectNode(tree, upEnd)
}
const selectUp = ({ tree }) =>
  AriaTree.selectNode(tree, tree._walker.previousNode())

const selectDown = ({ tree }) =>
  AriaTree.selectNode(tree, tree._walker.nextNode())

const selectRoot = ({ tree }) => {
  while (tree._walker.parentNode()) { }
  // Root item is not in a scroll container, we walk to the first element of container
  // to trigger scrollTop to 0, and then walk back up.
  AriaTree.selectNode(tree, tree._walker.nextNode())
  AriaTree.selectNode(tree, tree._walker.parentNode())
}
const selectLast = ({ tree }) => {
  while (tree._walker.nextNode()) { }
  AriaTree.selectNode(tree, tree._walker.currentNode)
}
const clickSelect = ({ tree }, opts = {}) =>
  AriaTree.selectNode(tree, tree._walker.currentNode, { focus: opts.notFocusIfTextArea })
const escapeEdit = ({ tree }, opts = {}) =>
  AriaTree.selectNode(tree, tree._walker.currentNode)

/* Basic ops */

const addSch = ({ tree, store }) => {
  let currentNode = tree._walker.currentNode
  let parent = Sch.get(store, currentNode.id)
  let index

  let defaultSch =
    parent._addSchDefault ||
    (parent.allowedSchs && parent.allowedSchs[0]) ||
    (store.allowedSchs && store.allowedSchs[0])

  if (!defaultSch) return

  if (store.put?.pos == "prepend") index = 0
  else index = Number.MAX_SAFE_INTEGER
  Sch.put(store, currentNode.id, [{ k: null, sch: () => Sch.clone(defaultSch), index: index }])

  tree._render(store)
  AriaTree.selectNode(tree, currentNode)
}

const activateEditKey = ({ tree, store }) => {
  let group = tree._walker.currentNode.closest("[role='group']")?.dataset?.group
  if (group == "keyed")
    activateEdit({ tree, store, editMode: "editKey" })
}
const activateEditType = ({ tree, store }) => {
  activateEdit({ tree, store, editMode: "editType" })
}
const activateEdit = ({ tree, store, editMode }) => {
  let currentNode = tree._walker.currentNode

  Sch.update(store, currentNode.id, (a, m) => ({ ...a, uiMode: editMode }))
  tree._render(store)

  let textArea = tree.querySelector("textarea")
  if (!textArea) return

  textArea._treeItem = currentNode
  textArea.onblur = e => e.relatedTarget && cancelTextArea(tree, store, textArea)
  textArea.focus()
}
const cancelTextArea = (tree, store, textArea) => {
  let updatedNode = Sch.update(store, textArea._treeItem.id, (a, m) => Object.assign(a, { uiMode: "cancelled-edit" }))

  tree._render(store)
  if (updatedNode) {
    tree._walker.currentNode = tree.querySelector(`[id='${CSS.escape(textArea._treeItem.id)}']`)
    AriaTree.selectNode(tree, tree._walker.currentNode)
  }
}

const submitEdit = ({ tree, store }, textArea) => {
  if (textArea.id == "key-edit") editSelected(tree, store, textArea, renameSelected)
  else if (textArea.id == "type-edit") editSelected(tree, store, textArea, changeTypeSelected)
}
const editSelected = (tree, store, textArea, f) => {
  let currentNode = tree._walker.currentNode

  textArea._treeItem = textArea.closest("[role='treeitem']")
  AriaTree.selectNode(tree, textArea._treeItem, { focus: false })

  let currentId = f(tree, store, textArea) || currentNode.id

  Sch.update(store, currentId, (a, m) => Object.assign(a, { uiMode: "editted" }))
  tree._render(store)

  tree._walker.currentNode = tree.querySelector(`[id='${CSS.escape(currentId)}']`)
  AriaTree.selectNode(tree, tree._walker.currentNode)
}
const changeTypeSelected = (tree, store, textArea) => {
  let allowedSch = store.allowedSchs.find(sch_ => sch_.type == textArea.value)
  let anchor = Object.keys(store._models).find(anchor => store._models[anchor] == textArea.value)
  let valSch = T.value(textArea.value)

  if (allowedSch) Sch.changeType(store, textArea._treeItem.id, () => Sch.clone(allowedSch))
  else if (anchor) Sch.changeType(store, textArea._treeItem.id, () => T.ref(anchor))
  else if (valSch) Sch.changeType(store, textArea._treeItem.id, () => valSch)
  return tree._walker.currentNode.id
}
const renameSelected = (tree, store, textArea) => {
  let indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let dstPath = textArea.dataset.parentPath

  indicesPerParent[textArea.dataset.parentPath] =
    indicesPerParent[textArea.dataset.parentPath]
      .filter(c => c.id == textArea._treeItem.id)
      .map(c => ({ id: c.id, newK: textArea.value, index: c.index }))

  let renameIndex = indicesPerParent[textArea.dataset.parentPath][0].index
  let moved = Sch.move(store, { dstPath, startIndex: renameIndex }, indicesPerParent)

  let newKey = moved[dstPath][0].k
  let ancestor = textArea._treeItem.parentNode.closest("[role='treeitem']")
  return `${ancestor.id}[${newKey}]`
}

const deleteSelected = ({ tree, store }) => {
  let nextStepNode =
    AriaTree.findUnselectedNode(() => tree._walker.nextSibling()) ||
    AriaTree.findUnselectedNode(() => tree._walker.previousSibling()) ||
    AriaTree.findUnselectedNode(() => tree._walker.parentNode())

  Sch.popToRawSchs(store, AriaTree.selectedGroupedByParent(tree))
  tree._render(store)
  AriaTree.selectNode(tree, nextStepNode)
}

const markAsEntry = ({ tree, store }) => {
  let currentNode = tree._walker.currentNode
  if (!currentNode) return

  if (store.entryable?.includes(currentNode.dataset.tag)) {
    Sch.update(store, currentNode.id, (a, m) => Object.assign(a, { isEntry: true }))
    tree._render(store)
    AriaTree.selectNode(tree, currentNode)
  }
}

/* Intermediate ops */
const clearClipboard = ({ tree }) => AriaTree.clearClipboard(tree)
const cut = ({ store, tree }) => {
  AriaTree.clearClipboard(tree)

  for (let a of tree.querySelectorAll("[aria-selected='true']")) a.classList.add("item-cutting")
  let selectedPerParent = AriaTree.selectedGroupedByParent(tree, { ops: ".item-cutting" })

  window._treeClipboard = {
    type: "cut",
    storeKey: store.key,
    ops: (dstPath) => Sch.popToRawSchs(store, selectedPerParent, { dstPath }),
    selected: selectedPerParent
  }
}
const copy = ({ store, tree }) => {
  if (document.getSelection().toString().length != 0) return
  AriaTree.clearClipboard(tree)

  for (let a of tree.querySelectorAll("[aria-selected='true']")) a.classList.add("item-copying")
  let selectedPerParent = AriaTree.selectedGroupedByParent(tree, { ops: ".item-copying" })

  window._treeClipboard = {
    type: "copy",
    storeKey: store.key,
    ops: (dstPath) => Sch.copyToRawSchs(store, selectedPerParent, { dstPath, startIndex: 0 }),
    selected: selectedPerParent
  }
}
const paste = ({ tree, store, srcStore }) => {
  const dstSch = Sch.get(store, tree._walker.currentNode.id)
  if (![T.RECORD, T.UNION, T.TUPLE].includes(dstSch.type)) return
  if (store.put?.onlyDst)
    if (!store.put.onlyDst[store.taggedLevel[dstSch._meta.level]]) return

  if (window._treeClipboard) {
    const dstPath = tree._walker.currentNode.id
    const { type, storeKey, ops, selected } = window._treeClipboard
    let selectedPerParent = selected
    let result = {}

    if (store.key == storeKey)
      switch (type) {
        case "copy":
          result = Sch.putSelected(store, { dstPath }, selectedPerParent)
          break
        case "cut":
          result = Sch.move(store, { dstPath }, selectedPerParent)
          break
      }
    else
      switch (type) {
        case "copy":
          let rawSchs = ops(dstPath)
          result = Sch.putSelectedRawSchs(store, { dstPath }, rawSchs)
          break
        case "cut":
          let poppedPerSrc = ops(dstPath)
          result = Sch.putPoppedRawSchs(store, { dstPath }, poppedPerSrc)
          break
      }

    const reselectDifferentTree = (tree, result) => {
      let result_ = {}
      for (let k of Object.keys(result))
        if (k == dstSch._meta.path)
          result_[""] = result[k]
        else
          result_[k] = result[k]

      tree._render(dstSch)
      AriaTree.clearClipboard(tree)
      AriaTree.reselectNodes(tree, result_)
    }

    if (Object.keys(result).length != 0) {
      if (dstSch._tree) reselectDifferentTree(dstSch._tree, result)
      else {
        tree._render(store)
        AriaTree.clearClipboard(tree)
        AriaTree.reselectNodes(tree, result)
      }
    }
  }
}

const cloneUp = ({ tree, store }) =>
  cloneSelected({ tree, store, direction: "up" }, (ascSelected) => ascSelected[0].index)
const cloneDown = ({ tree, store }) =>
  cloneSelected({ tree, store, direction: "down" }, (ascSelected) => ascSelected[ascSelected.length - 1].index + 1)
const cloneSelected = ({ tree, store, direction }, fStartIndex) => {
  let indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let result = {}

  for (let dstPath of Object.keys(indicesPerParent))
    result = Sch.putSelected(store,
      { dstPath, startIndex: fStartIndex(indicesPerParent[dstPath]) },
      { [dstPath]: indicesPerParent[dstPath] })

  if (Object.keys(result).length != 0) {
    tree._render(store)
    AriaTree.reselectNodes(tree, result, { direction })
  }
}

const reorderUp = ({ tree, store }) =>
  reorder({ tree, store, startIndex: i => i - 1, direction: "up" })
const reorderDown = ({ tree, store }) =>
  reorder({ tree, store, startIndex: i => i + 1, direction: "down" })
const reorder = ({ tree, store, startIndex, direction }) => {
  const indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let moved = {}

  for (let dstPath of Object.keys(indicesPerParent)) {
    let ascSelected = indicesPerParent[dstPath].sort((a, b) => a.index - b.index)
    moved = Sch.move(store, { dstPath, startIndex: startIndex(ascSelected[0].index) }, indicesPerParent)
  }

  if (Object.keys(moved).length != 0) {
    tree._render(store)
    AriaTree.reselectNodes(tree, moved, { direction })
  }
}