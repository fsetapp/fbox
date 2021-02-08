import * as Sch from "./sch.js"
import * as T from "./sch/type.js"
import * as View from "./sch/view.js"
import * as AriaTree from "./aria_tree.js"

"use strict"

const allSchs = [T.record, T.list, T.tuple, T.union, T.any, T.string, T.bool, T.number, T.nil, () => T.value("\"json string\"")]
var store = { ...T.record(), _box: T.FMODEL_BOX }

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
}

const pressSelect = (e, tree, nextStepSiblingFn, nextStepNodeFn, endStepNodeFn) => {
  if (e.shiftKey && e.metaKey)
    AriaTree.selectMultiNodeTo(tree, tree._walker.currentNode, endStepNodeFn())
  else if (e.shiftKey)
    AriaTree.selectMultiNode(tree._walker.currentNode, nextStepSiblingFn())
  else if (e.metaKey)
    AriaTree.selectNode(tree, endStepNodeFn())
  else
    AriaTree.selectNode(tree, nextStepNodeFn())
}

function handleTreeKeydown(e) {
  let tree = this
  let currentNode = tree._walker.currentNode

  if (e.target instanceof HTMLTextAreaElement) return handleTextAreaKeyDown(e, tree)

  switch (e.code) {
    case "ArrowUp":
      pressSelect(e, tree, () => tree._walker.previousSibling(), () => tree._walker.previousNode(), () => { tree._walker.parentNode(); return tree._walker.firstChild() })
      e.preventDefault()
      break
    case "ArrowDown":
      pressSelect(e, tree, () => tree._walker.nextSibling(), () => tree._walker.nextNode(), () => { tree._walker.parentNode(); return tree._walker.lastChild() })
      e.preventDefault()
      break
    case "Delete":
      let nextStepNode =
        AriaTree.findUnselectedNode(() => tree._walker.nextSibling()) ||
        AriaTree.findUnselectedNode(() => tree._walker.previousSibling()) ||
        AriaTree.findUnselectedNode(() => tree._walker.parentNode())

      deleteSelected(tree)
      View.renderRoot(store)
      AriaTree.selectNode(tree, nextStepNode)
      break
    case "KeyX":
      if (e.metaKey) {
        AriaTree.clearClipboard(tree)

        tree._clipboard = () => AriaTree.selectedGroupedByParent(tree, { ops: ".item-cutting" })
        for (let a of tree.querySelectorAll("[aria-selected='true']")) a.classList.add("item-cutting")
      }
      break
    case "KeyV":
      const dstSch = Sch.get(store, tree._walker.currentNode.id)
      if (![T.RECORD, T.UNION, T.TUPLE].includes(dstSch.type)) return

      if (e.metaKey && tree._clipboard) {
        const dstPath = tree._walker.currentNode.id
        const selectedPerParent = tree._clipboard()

        let moved = Sch.move(store, { dstPath, startIndex: 0 }, selectedPerParent)
        if (Object.keys(moved).length != 0) {
          View.renderRoot(store)
          AriaTree.clearClipboard(tree)
          AriaTree.reselectNodes(tree, moved)
        }
      }
      break
    case "Enter":
      let group = currentNode.closest("[role='group']")?.dataset?.group
      let editMode

      if (group && e.shiftKey) editMode = "editType"
      else if (group == "keyed") editMode = "editKey"

      if (editMode) {
        Sch.update(store, currentNode.id, (a, m) => ({ ...a, uiMode: editMode }))
        View.renderRoot(store)

        let textArea = tree.querySelector("textarea")
        textArea._treeItem = currentNode
        textArea.onblur = e => cancelTextArea(e, tree, textArea)
        textArea.focus()
      }
      break
    case "Home":
      while (tree._walker.parentNode()) { }
      AriaTree.selectNode(tree, tree._walker.nextNode())
      break
    case "End":
      while (tree._walker.nextNode()) { }
      AriaTree.selectNode(tree, tree._walker.currentNode)
      break
    case "Escape":
      AriaTree.clearClipboard(tree)
      break
    default:
      switch (e.key) {
        case "+":
          let randomSch = allSchs[ranInt(allSchs.length)]

          Sch.put(store, currentNode.id, [{ k: null, sch: randomSch, index: 0 }])
          View.renderRoot(store)
          break
      }
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
}

const ranInt = max => Math.floor(Math.random() * Math.floor(max));

addEventListener("DOMContentLoaded", e => {
  document.querySelectorAll("[role='tree']").forEach(tree => {
    AriaTree.createWalker(tree)
    tree.onkeydown = handleTreeKeydown
    tree.onclick = handleTreeClick

    AriaTree.selectNode(tree, tree._walker.nextNode())
  })
})


let fixture = []
for (var i = 0; i < 1000; i++)
  fixture.push(allSchs[ranInt(allSchs.length)])

fixture.reverse().forEach((sch, i) =>
  Sch.put(store, "", [{ k: `model_${fixture.length - i}`, sch: sch, index: 0 }])
)

View.renderRoot(store)
