import * as Sch from "./sch.js"
import * as T from "./sch/type.js"
import * as View from "./sch/view.js"
import * as SchMeta from "./sch/meta.js"
import * as AriaTree from "./aria_tree.js"
import { randInt } from "./utils.js"

"use strict"

const allSchs = [T.record, T.list, T.tuple, T.union, T.any, T.string, T.bool, T.number, T.nil, () => T.value("\"json string\"")]
var store = { ...T.putAnchor(T.record), _box: T.FMODEL_BOX }

const deleteSelected = (tree) => {
  const indicesPerParent = AriaTree.selectedGroupedByParent(tree)

  for (let parentPath of Object.keys(indicesPerParent))
    Sch.pop(store, parentPath, indicesPerParent[parentPath].map(c => c.index))
}

const renameSelected = (tree, textArea) => {
  let indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let dstPath = textArea.dataset.parentPath

  indicesPerParent[textArea.dataset.parentPath] =
    indicesPerParent[textArea.dataset.parentPath]
      .filter(c => c.id == textArea._treeItem.id)
      .map(c => ({ id: c.id, newK: textArea.value, index: c.index }))

  let renameIndex = indicesPerParent[textArea.dataset.parentPath][0].index
  let moved = Sch.move(store, { dstPath, startIndex: renameIndex }, indicesPerParent)

  return moved[dstPath][0].k
}

const changeTypeSelected = (tree, textArea) => {
  let newSch = allSchs.filter(sch_ => sch_().type == textArea.value)[0]
  let model = store.order.filter(model => model == textArea.value)[0]
  let valSch = T.value(textArea.value)

  if (newSch) Sch.changeType(store, textArea._treeItem.id, newSch)
  else if (model) Sch.changeType(store, textArea._treeItem.id, () => T.ref(store.fields[model].$anchor))
  else if (valSch) Sch.changeType(store, textArea._treeItem.id, () => valSch)
}

const editSelected = (e, tree, textArea, f) => {
  let currentNode = tree._walker.currentNode

  textArea._treeItem = textArea.closest("[role='treeitem']")
  AriaTree.selectNode(tree, textArea._treeItem, { focus: false })

  let currentId = f(tree, textArea) || currentNode.id

  Sch.update(store, currentId, (a, m) => Object.assign(a, { uiMode: "editted" }))
  View.renderRoot(store)

  tree._walker.currentNode = tree.querySelector(`[id='${CSS.escape(currentId)}']`)
  AriaTree.selectNode(tree, tree._walker.currentNode)
}
const editKey = (e, tree, textArea) => {
  editSelected(e, tree, textArea, () => {
    let newKey = renameSelected(tree, textArea)
    let ancestor = textArea._treeItem.parentNode.closest("[role='treeitem']")
    return `${ancestor.id}[${newKey}]`
  })
}

const editType = (e, tree, textArea) => {
  editSelected(e, tree, textArea, () => {
    changeTypeSelected(tree, textArea)
    return null
  })
}

const cancelTextArea = (e, tree, textArea) => {
  let updatedNode = Sch.update(store, textArea._treeItem.id, (a, m) => Object.assign(a, { uiMode: "cancelled-edit" }))

  View.renderRoot(store)
  if (updatedNode) {
    tree._walker.currentNode = tree.querySelector(`[id='${CSS.escape(textArea._treeItem.id)}']`)
    AriaTree.selectNode(tree, tree._walker.currentNode)
  }
}

const handleTextAreaKeyDown = (e, tree) => {
  let currentNode = tree._walker.currentNode
  let textArea = e.target

  switch (e.code) {
    case "Enter":
      if (!e.shiftKey && textArea.id == "key-edit")
        editKey(e, tree, textArea)
      else if (!e.shiftKey && textArea.id == "type-edit")
        editType(e, tree, textArea)
      break
  }

  renderSchMeta(tree)
}

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
  AriaTree.selectNode(tree, tree._walker.nextNode())
}
const selectLast = ({ tree }) => {
  while (tree._walker.nextNode()) { }
  AriaTree.selectNode(tree, tree._walker.currentNode)
}

const deleteSelected_ = ({ tree, store }) => {
  let nextStepNode =
    AriaTree.findUnselectedNode(() => tree._walker.nextSibling()) ||
    AriaTree.findUnselectedNode(() => tree._walker.previousSibling()) ||
    AriaTree.findUnselectedNode(() => tree._walker.parentNode())

  deleteSelected(tree)
  View.renderRoot(store)
  AriaTree.selectNode(tree, nextStepNode)
}

const cut = ({ tree }) => {
  AriaTree.clearClipboard(tree)

  tree._clipboard = { type: "cut", ops: () => AriaTree.selectedGroupedByParent(tree, { ops: ".item-cutting" }) }
  for (let a of tree.querySelectorAll("[aria-selected='true']")) a.classList.add("item-cutting")
}
const copy = ({ tree }) => {
  AriaTree.clearClipboard(tree)

  tree._clipboard = { type: "copy", ops: () => AriaTree.selectedGroupedByParent(tree, { ops: ".item-copying" }) }
  for (let a of tree.querySelectorAll("[aria-selected='true']")) a.classList.add("item-copying")
}
const paste = ({ tree, store }) => {
  const dstSch = Sch.get(store, tree._walker.currentNode.id)
  if (![T.RECORD, T.UNION, T.TUPLE].includes(dstSch.type)) return

  if (tree._clipboard) {
    const dstPath = tree._walker.currentNode.id
    const { type, ops } = tree._clipboard
    let selectedPerParent = ops()
    let result

    switch (type) {
      case "copy":
        result = Sch.putSelected(store, { dstPath }, selectedPerParent)
        break
      case "cut":
        result = Sch.move(store, { dstPath }, selectedPerParent)
        break
    }

    if (Object.keys(result).length != 0) {
      View.renderRoot(store)
      AriaTree.clearClipboard(tree)
      AriaTree.reselectNodes(tree, result)
    }
  }
}

const activateEdit = ({ tree, store, editMode }) => {
  let currentNode = tree._walker.currentNode

  Sch.update(store, currentNode.id, (a, m) => ({ ...a, uiMode: editMode }))
  View.renderRoot(store)

  let textArea = tree.querySelector("textarea")
  textArea._treeItem = currentNode
  textArea.onblur = e => cancelTextArea(e, tree, textArea)
  textArea.focus()
}
const activateEditKey = ({ tree, store }) => {
  let group = tree._walker.currentNode.closest("[role='group']")?.dataset?.group
  if (group == "keyed")
    activateEdit({ tree, store, editMode: "editKey" })
}
const activateEditType = ({ tree, store }) => {
  activateEdit({ tree, store, editMode: "editType" })
}

const addSch = ({ tree, store }) => {
  let currentNode = tree._walker.currentNode
  let randomSch = allSchs[randInt(allSchs.length)]

  Sch.put(store, currentNode.id, [{ k: null, sch: randomSch, index: 0 }])
  View.renderRoot(store)
  AriaTree.selectNode(tree, currentNode)
}

const reorder = ({ tree, store, startIndex, direction }) => {
  const indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let moved

  for (let dstPath of Object.keys(indicesPerParent)) {
    let ascSelected = indicesPerParent[dstPath].sort((a, b) => a.index - b.index)
    moved = Sch.move(store, { dstPath, startIndex: startIndex(ascSelected[0].index) }, indicesPerParent)
  }

  if (Object.keys(moved).length != 0) {
    View.renderRoot(store)
    AriaTree.reselectNodes(tree, moved, { direction })
  }
}
const reorderUp = ({ tree, store }) =>
  reorder({ tree, store, startIndex: i => i - 1, direction: "up" })

const reorderDown = ({ tree, store }) =>
  reorder({ tree, store, startIndex: i => i + 1, direction: "down" })

const cloneSelected = ({ tree, store, direction }, fStartIndex) => {
  let indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let result

  for (let dstPath of Object.keys(indicesPerParent))
    result = Sch.putSelected(store,
      { dstPath, startIndex: fStartIndex(indicesPerParent[dstPath]) },
      { [dstPath]: indicesPerParent[dstPath] })

  if (Object.keys(result).length != 0) {
    View.renderRoot(store)
    AriaTree.reselectNodes(tree, result, { direction })
  }
}
const cloneUp = ({ tree, store }) =>
  cloneSelected({ tree, store, direction: "up" }, (ascSelected) => ascSelected[0].index)

const cloneDown = ({ tree, store }) =>
  cloneSelected({ tree, store, direction: "down" }, (ascSelected) => ascSelected[ascSelected.length - 1].index + 1)

const toCmdkey = ({ shiftKey, metaKey, altKey, ctrlKey, key }) => {
  let cmd = []
  if (shiftKey) cmd.push("shift")
  if (metaKey) cmd.push("meta")
  else if (ctrlKey) cmd.push("meta")
  if (altKey) cmd.push("alt")
  if (key) cmd.push(key)
  return cmd.join("-")
}
var treeKeyDownCmd = new Map([
  ["shift-meta-ArrowUp", selectMultiNodeUpTo],
  ["shift-meta-ArrowDown", selectMultiNodeDownTo],
  ["shift-ArrowUp", selectMultiNodeUp],
  ["shift-ArrowDown", selectMultiNodeDown],
  ["meta-ArrowUp", selectUpEnd],
  ["meta-ArrowDown", selectDownEnd],
  ["ArrowUp", selectUp],
  ["ArrowDown", selectDown],
  ["Home", selectRoot],
  ["End", selectLast],
  ["Delete", deleteSelected_],
  ["meta-x", cut],
  ["meta-c", copy],
  ["meta-v", paste],
  ["shift-alt-ArrowUp", cloneUp],
  ["shift-alt-ArrowDown", cloneDown],
  ["Enter", activateEditKey],
  ["shift-Enter", activateEditType],
  ["Escape", ({ tree }) => AriaTree.clearClipboard(tree)],
  ["shift-+", addSch],
  ["alt-ArrowUp", reorderUp],
  ["alt-ArrowDown", reorderDown],
])

function handleTreeKeydown(e) {
  let tree = this
  if (e.target instanceof HTMLTextAreaElement) return handleTextAreaKeyDown(e, tree)

  let command = treeKeyDownCmd.get(toCmdkey(e))
  command && command({ tree, store })

  switch (e.code) {
    case "ArrowUp":
      e.preventDefault()
      break
    case "ArrowDown":
      e.preventDefault()
      break
  }

  renderSchMeta(tree)
}

const renderSchMeta = (tree) => {
  let selected = tree.querySelectorAll("[id='fmodel'] [aria-selected='true']")
  if (selected.length == 1) {
    let sch = Sch.get(store, selected[0].id)
    sch.key = selected[0].key
    sch.path = selected[0].id

    View.renderMeta(tree._metaContainer, sch, store)
  }
}

function handleTreeClick(e) {
  let tree = this
  let start = tree._walker.currentNode
  let target = e.target.closest("[role='treeitem']")
  let notFocusIfTextArea = !tree.querySelector("textarea")

  if (!target) return
  if (e.shiftKey || e.metaKey) {
    switch (start.compareDocumentPosition(target)) {
      case Node.DOCUMENT_POSITION_CONTAINS:
        return AriaTree.selectNode(tree, target)
      case Node.DOCUMENT_POSITION_CONTAINED_BY:
        return AriaTree.selectNode(tree, start)
      default:
        if (target.parentNode.closest("[role='treeitem']") != start.parentNode.closest("[role='treeitem']"))
          return AriaTree.selectNode(tree, target)
    }
  }
  if (e.shiftKey)
    AriaTree.selectMultiNodeTo(tree, start, target)
  else if (e.metaKey)
    AriaTree.toggleSelectNode(tree._walker.currentNode = target)
  else
    AriaTree.selectNode(tree, target, { focus: notFocusIfTextArea })

  renderSchMeta(tree)
}

document.addEventListener("sch-update", (e) => {
  let { path, attrs } = e.detail
  let sch = Sch.update(store, path, (a, m) => SchMeta.save(a, attrs))

  View.renderRoot(store)
  View.renderMeta(e.target.closest("sch-meta"), sch, store)
})

addEventListener("DOMContentLoaded", e => {
  View.renderRoot(store)

  let tree = document.querySelector("[id='fmodel'] [role='tree']")
  if (tree) {
    AriaTree.createWalker(tree)
    tree.onkeydown = handleTreeKeydown
    tree.onclick = handleTreeClick
    AriaTree.selectNode(tree, tree._walker.nextNode())

    tree._metaContainer = document.querySelector("sch-meta")
    renderSchMeta(tree)
  }
})

let fixture = []
for (var i = 0; i < 1000; i++)
  fixture.push(allSchs[randInt(allSchs.length)])

fixture.forEach((sch, i) =>
  Sch.put(store, "", [{ k: `model_${fixture.length - i}`, sch: sch, index: 0 }])
)
