import * as Sch from "./sch.js"
import * as T from "./sch/type.js"
import { renderRoot } from "./sch/view.js"
import * as AriaTree from "./aria_tree.js"

"use strict"

const allSchs = [T.record, T.list, T.tuple, T.union, T.any, T.string, T.bool, T.number, T.nil, () => T.value("\"json string\"")]
var store = { ...T.record(), _box: T.FMODEL_BOX }
const clone = (obj) => JSON.parse(JSON.stringify(obj))

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
  AriaTree.selectNode(tree, currentNode, textArea._treeItem, { focus: false })

  let currentId = f(tree, textArea) || currentNode.id

  Sch.update(store, currentId, (a, m) => ({ ...a, uiMode: "view" }))
  renderRoot(store)

  tree._walker.currentNode = tree.querySelector(`[id='${CSS.escape(currentId)}']`)
  AriaTree.selectNode(tree, currentNode, tree._walker.currentNode)
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
  Sch.update(store, textArea._treeItem.id, (a, m) => ({ ...a, uiMode: "view" }))
  renderRoot(store)
  tree._walker.currentNode = tree.querySelector(`[id='${CSS.escape(textArea._treeItem.id)}']`)
  AriaTree.selectNode(tree, textArea._treeItem, tree._walker.currentNode)
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
}

function handleTreeKeydown(e) {
  let tree = this
  let currentNode = tree._walker.currentNode

  if (e.target instanceof HTMLTextAreaElement) return handleTextAreaKeyDown(e, tree)

  const pressSelect = (e, tree, nextStepSibling, nextStepNode) => {
    let nextStepSibling_

    if (e.shiftKey && e.metaKey)
      AriaTree.selectMultiAllNodes(tree, nextStepSibling)
    else if (e.shiftKey)
      AriaTree.selectMultiNode(currentNode, nextStepSibling())
    else
      AriaTree.selectNode(tree, currentNode, nextStepNode())
  }

  switch (e.code) {
    case "ArrowUp":
      pressSelect(e, tree, () => tree._walker.previousSibling(), () => tree._walker.previousNode())
      e.preventDefault()
      break
    case "ArrowDown":
      pressSelect(e, tree, () => tree._walker.nextSibling(), () => tree._walker.nextNode())
      e.preventDefault()
      break
    case "Delete":
      let nextStepNode =
        AriaTree.findUnselectedNode(() => tree._walker.nextSibling()) ||
        AriaTree.findUnselectedNode(() => tree._walker.previousSibling()) ||
        AriaTree.findUnselectedNode(() => tree._walker.parentNode())

      deleteSelected(tree)
      renderRoot(store)
      AriaTree.selectNode(tree, currentNode, nextStepNode)
      break
    case "KeyX":
      if (e.metaKey) {
        AriaTree.clearClipboard(tree)

        tree._clipboard = () => AriaTree.selectedGroupedByParent(tree, { ops: ".item-cutting" })
        tree.querySelectorAll("[aria-selected='true']").forEach(a => a.classList.add("item-cutting"))
      }
      break
    case "KeyV":
      const dstSch = Sch.get(store, tree._walker.currentNode.id)
      if (![T.RECORD, T.UNION, T.TUPLE].includes(dstSch.type)) return

      if (e.metaKey && tree._clipboard) {
        const dstPath = tree._walker.currentNode.id
        const selectedPerParent = tree._clipboard()

        let moved = Sch.move(store, { dstPath, startIndex: 0 }, selectedPerParent)
        renderRoot(store)
        AriaTree.clearClipboard(tree)
        AriaTree.reselectNodes(tree, moved)
      }
      break
    case "Enter":
      let group = currentNode.closest("[role='group']")?.dataset?.group
      let editMode

      if (group && e.shiftKey) editMode = "editType"
      else if (group == "keyed") editMode = "editKey"

      if (editMode) {
        Sch.update(store, currentNode.id, (a, m) => ({ ...a, uiMode: editMode }))
        renderRoot(store)
        let textArea = tree.querySelector("textarea")
        textArea._treeItem = currentNode
        textArea.onblur = e => cancelTextArea(e, tree, textArea)
        textArea.focus()
      }
      break
    case "Home":
      while (tree._walker.parentNode()) { }
      AriaTree.selectNode(tree, currentNode, tree._walker.currentNode)
      break
    case "End":
      while (tree._walker.nextNode()) { }
      AriaTree.selectNode(tree, currentNode, tree._walker.currentNode)
      break
    case "Escape":
      AriaTree.clearClipboard(tree)
      break
    default:
      switch (e.key) {
        case "+":
          let randomSch = allSchs[ranInt(allSchs.length)]

          Sch.put(store, currentNode.id, [{ k: null, sch: randomSch, index: 0 }])
          renderRoot(store)
          break
      }
  }
}

function handleTreeClick(e) {
  let tree = this
  let prevtNode = tree._walker.currentNode
  let itemTarget = e.target.closest("[role='treeitem']")

  if (itemTarget) {
    tree._walker.currentNode = itemTarget
    AriaTree.selectNode(tree, prevtNode, tree._walker.currentNode, { focus: !tree._walker.currentNode.querySelector("textarea") })
  }
}

const ranInt = max => Math.floor(Math.random() * Math.floor(max));

addEventListener("DOMContentLoaded", e => {
  document.querySelectorAll("[role='tree']").forEach(tree => {
    AriaTree.createWalker(tree)
    tree.onkeydown = handleTreeKeydown
    tree.onclick = handleTreeClick

    let firstNode = tree._walker.nextNode()
    AriaTree.selectNode(tree, firstNode, firstNode)
  })
})

allSchs.reverse().forEach((sch, i) =>
  Sch.put(store, "", [{ k: `model_${allSchs.length - i}`, sch: sch, index: 0 }])
)

renderRoot(store)
