import * as Sch from "./sch.js"
import * as T from "./sch/type.js"
import { renderRoot } from "./sch/view.js"

"use strict"

const allSchs = [T.record, T.list, T.tuple, T.union, T.any, T.string, T.bool, T.number, T.nil, () => T.value("\"json string\"")]
var store = { ...T.record(), _box: T.FMODEL_BOX }
const clone = (obj) => JSON.parse(JSON.stringify(obj))

const selectedGroupedByParent = (tree, opts = {}) =>
  [...tree.querySelectorAll(`${opts.ops || "[aria-selected='true']"}`)].reduce((acc, child) => {
    let parent = child.parentNode.closest("[role='treeitem']")
    if (!parent) return acc

    let parentLevel = parseInt(parent.getAttribute("aria-level"))
    let children = parent.querySelectorAll(`[aria-level='${parentLevel + 1}'][role='treeitem']`)

    child.index = [...children].indexOf(child)
    acc[parent.id] = acc[parent.id] || []
    acc[parent.id].push(child)
    return acc
  }, {})

const deleteSelected = (tree) => {
  const indicesPerParent = selectedGroupedByParent(tree)

  for (let parentPath of Object.keys(indicesPerParent))
    Sch.pop(store, parentPath, indicesPerParent[parentPath].map(c => c.index))
}

const renameSelected = (tree, textArea) => {
  let indicesPerParent = selectedGroupedByParent(tree)
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

const selectNode = (tree, currentNode, nextStepNode, opts = { focus: true }) => {
  if (nextStepNode) {
    deselectAllNode(tree, currentNode)
    selectMultiNode(nextStepNode, opts)
  }
}
const deselectAllNode = (tree, currentNode) => {
  [...tree.querySelectorAll("[aria-selected='true']")]
    .forEach(item => item.setAttribute("aria-selected", false))
  currentNode.tabIndex = -1
  currentNode.setAttribute("aria-selected", false)

  let _ = [...tree.querySelectorAll(".item-pasted")]
    .forEach(a => a.classList.remove("item-pasted"))
}
const selectMultiNode = (nextStepNode, opts = { focus: true }) => {
  if (nextStepNode) {
    nextStepNode.setAttribute("aria-selected", true)
    nextStepNode.tabIndex = 0
    opts.focus && nextStepNode.focus()
  }
}
const findUnselectedNode = (fstep, nextNode) => {
  do nextNode = fstep()
  while (nextNode?.getAttribute("aria-selected") == "true")
  return nextNode
}
const reselectNodes = (tree, nodes) => {
  for (let newDst of Object.keys(nodes)) {
    let rawSchs = nodes[newDst]

    newDst = tree.querySelector(`[id='${CSS.escape(newDst)}']`)
    let dstLevel = parseInt(newDst.getAttribute("aria-level"))
    let children = newDst.querySelectorAll(`[aria-level='${dstLevel + 1}'][role='treeitem']`)

    deselectAllNode(tree, tree._walker.currentNode)
    rawSchs.map(({ index }) => children[index]).forEach(a => {
      a.classList.add("item-pasted")
      selectMultiNode(a)
      tree._walker.currentNode = a
    })
  }
}

const clearClipboard = (tree) => {
  tree.querySelectorAll(".item-cutting").forEach(a => a.classList.remove("item-cutting"))
  tree._clipboard = null
}

const editSelected = (e, tree, textArea, f) => {
  let currentNode = tree._walker.currentNode

  textArea._treeItem = textArea.closest("[role='treeitem']")
  selectNode(tree, currentNode, textArea._treeItem, { focus: false })

  let currentId = f(tree, textArea) || currentNode.id

  Sch.update(store, currentId, (a, m) => ({ ...a, uiMode: "view" }))
  renderRoot(store)

  tree._walker.currentNode = tree.querySelector(`[id='${CSS.escape(currentId)}']`)
  selectNode(tree, currentNode, tree._walker.currentNode)
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
  selectNode(tree, textArea._treeItem, tree._walker.currentNode)
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

  switch (e.code) {
    case "ArrowUp":
      e.shiftKey ?
        selectMultiNode(tree._walker.previousSibling()) :
        selectNode(tree, currentNode, tree._walker.previousNode())
      e.preventDefault()
      break
    case "ArrowDown":
      e.shiftKey ?
        selectMultiNode(tree._walker.nextSibling()) :
        selectNode(tree, currentNode, tree._walker.nextNode())
      e.preventDefault()
      break
    case "Delete":
      let nextNode =
        findUnselectedNode(() => tree._walker.nextSibling()) ||
        findUnselectedNode(() => tree._walker.previousSibling()) ||
        findUnselectedNode(() => tree._walker.parentNode())

      deleteSelected(tree)
      renderRoot(store)
      selectNode(tree, currentNode, nextNode)
      break
    case "KeyX":
      if (e.metaKey) {
        clearClipboard(tree)

        tree._clipboard = () => selectedGroupedByParent(tree, { ops: ".item-cutting" })
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
        clearClipboard(tree)
        reselectNodes(tree, moved)
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
      selectNode(tree, currentNode, tree._walker.currentNode)
      break
    case "End":
      while (tree._walker.parentNode()) { }
      tree._walker.nextNode()
      while (tree._walker.nextSibling()) { }
      selectNode(tree, currentNode, tree._walker.currentNode)
      break
    case "Escape":
      clearClipboard(tree)
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
    selectNode(tree, prevtNode, tree._walker.currentNode, { focus: !tree._walker.currentNode.querySelector("textarea") })
  }
}

const ranInt = max => Math.floor(Math.random() * Math.floor(max));

addEventListener("DOMContentLoaded", e => {
  document.querySelectorAll("[role='tree']").forEach(tree => {
    tree._walker = document.createTreeWalker(
      tree,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function (node) {
          if (node.hasAttribute("aria-selected")) return NodeFilter.FILTER_ACCEPT
          else return NodeFilter.FILTER_SKIP
        }
      },
      false
    )
    tree.onkeydown = handleTreeKeydown
    tree.onclick = handleTreeClick

    let firstNode = tree._walker.nextNode()
    selectNode(tree, firstNode, firstNode)
  })
})

allSchs.reverse().forEach((sch, i) =>
  Sch.put(store, "", [{ k: `model_${allSchs.length - i}`, sch: sch, index: 0 }])
)

renderRoot(store)
