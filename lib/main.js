import * as Sch from "./sch.js"
import * as T from "./sch/type.js"
import * as View from "./sch/view.js"
import * as SchMeta from "./sch/meta.js"
import * as AriaTree from "./aria_tree.js"

const allSchs = [T.string, T.record, T.list, T.tuple, T.union, T.any, T.bool, T.number, T.nil, () => T.value("\"json string\"")]
const createStore = (opts = {}) => {
  let s = T.putAnchor(T.record)
  s._box = opts.tag || T.FMODEL_BOX
  s._allSchs = opts.allowedSchs || allSchs
  if (opts.put) s.put = opts.put
  if (opts.paste) s.paste = opts.paste
  return s
}

export {
  initModelView,
  initFileView,
  update,
  createStore,
  allSchs,
  isItemchangedCmd
}
const isSingleSelect = (cmdname) => [selectUp, selectDown, selectUpEnd, selectDownEnd, selectRoot, selectLast, { name: "clickSelect" }].map(cmd => cmd.name).includes(cmdname)
const isClone = (cmdname) => [cloneUp, cloneDown].map(cmd => cmd.name).includes(cmdname)
const isItemchangedCmd = (cmdname) => isClone(cmdname) || isSingleSelect(cmdname)

const treeKeyDownCmd = () => new Map([
  // Selection
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

  // Basic ops
  ["shift-+", addSch],
  ["Enter", activateEditKey],
  ["shift-Enter", activateEditType],
  ["Delete", deleteSelected],

  // Intermediate ops
  ["meta-x", cut],
  ["meta-c", copy],
  ["meta-v", paste],
  ["shift-alt-ArrowUp", cloneUp],
  ["shift-alt-ArrowDown", cloneDown],
  ["alt-ArrowUp", reorderUp],
  ["alt-ArrowDown", reorderDown],

  ["Escape", ({ tree }) => AriaTree.clearClipboard(tree)],
])

const handleTreeKeydown = (store, opts = {}) => function (e) { handleTreeKeydown_(e, this, store, opts) }
async function handleTreeKeydown_(e, tree, store, opts) {
  if (e.target instanceof HTMLTextAreaElement) return handleTextAreaKeyDown(e, tree, store)

  let command = treeKeyDownCmd().get(toCmdkey(e))
  if (!command) return
  if ((opts.denyCmds || []).includes(command.name)) return

  command({ tree, store })

  switch (e.code) {
    case "ArrowUp":
      e.preventDefault()
      break
    case "ArrowDown":
      e.preventDefault()
      break
  }
  tree.renderSchMeta()
  let fileItem = tree._walker.currentNode.closest("[aria-level='2']") || tree._walker.currentNode
  tree.dispatchEvent(new CustomEvent("tree-command", { bubbles: true, detail: { file: fileItem.key, path: tree._walker.currentNode.id, command: command } }))
}

const textAreaKeyDownCmd = () => new Map([
  ["Enter", submitEdit]
])
const handleTextAreaKeyDown = (e, tree, store) => {
  let textArea = e.target

  let command = textAreaKeyDownCmd().get(toCmdkey(e))
  if (!command) return


  command({ tree, store }, textArea)
  tree.renderSchMeta()
  let fileItem = tree._walker.currentNode.closest("[aria-level='2']") || tree._walker.currentNode
  tree.dispatchEvent(new CustomEvent("tree-command", { bubbles: true, detail: { file: fileItem.key, path: tree._walker.currentNode.id, command: command } }))
}

const handleTreeClick = (store) => function (e) { return handleTreeClick_(e, this, store) }
function handleTreeClick_(e, tree, store) {
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
    AriaTree.toggleSelectNode(start, tree._walker.currentNode = target)
  else {
    let fileItem = target.closest("[aria-level='2']") || target
    const clickSelect = ({ tree, store }) => AriaTree.selectNode(tree, target, { focus: notFocusIfTextArea })
    clickSelect({ tree, store })
    tree.dispatchEvent(new CustomEvent("tree-command", { bubbles: true, detail: { file: fileItem.key, path: target.id, command: clickSelect } }))
  }

  tree.renderSchMeta()
}
const renderSchMeta = ({ tree, store }) => {
  let selected = tree.querySelectorAll("[id='fmodel'] [aria-selected='true']")
  if (selected.length == 1) {
    let sch = Sch.get(store, selected[0].id)
    sch.key = selected[0].key
    sch.path = selected[0].id
    sch.rootKey = tree.querySelector(".root-item").key

    View.renderMeta(tree._metaContainer, sch, store)
  }
}
const toCmdkey = ({ shiftKey, metaKey, altKey, ctrlKey, key }) => {
  let cmd = []
  if (shiftKey) cmd.push("shift")
  if (metaKey) cmd.push("meta")
  else if (ctrlKey) cmd.push("meta")
  if (altKey) cmd.push("alt")
  if (key) cmd.push(key)
  return cmd.join("-")
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
  AriaTree.selectNode(tree, tree._walker.currentNode)
}
const selectLast = ({ tree }) => {
  while (tree._walker.nextNode()) { }
  AriaTree.selectNode(tree, tree._walker.currentNode)
}


/* Basic ops */

const addSch = ({ tree, store }) => {
  let currentNode = tree._walker.currentNode
  let parent = Sch.get(store, currentNode.id)
  let index
  let allowedSchs = parent._allSchs || store._allSchs

  if (parent.put?.pos == "prepend") index = 0
  else index = Number.MAX_SAFE_INTEGER
  Sch.put(store, currentNode.id, [{ k: null, sch: allowedSchs[0], index: index }])

  tree._render()
  tree.scrollTop = tree.style.height
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
  tree._render()

  let textArea = tree.querySelector("textarea")
  if (!textArea) return

  textArea._treeItem = currentNode
  textArea.onblur = e => cancelTextArea(tree, store, textArea)
  textArea.focus()
}
const cancelTextArea = (tree, store, textArea) => {
  let updatedNode = Sch.update(store, textArea._treeItem.id, (a, m) => Object.assign(a, { uiMode: "cancelled-edit" }))

  tree._render()
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
  tree._render()

  tree._walker.currentNode = tree.querySelector(`[id='${CSS.escape(currentId)}']`)
  AriaTree.selectNode(tree, tree._walker.currentNode)
}
const changeTypeSelected = (tree, store, textArea) => {
  let newSch = store._allSchs.find(sch_ => sch_().type == textArea.value)
  let anchor = Object.keys(store._models).find(anchor => store._models[anchor] == textArea.value)
  let valSch = T.value(textArea.value)

  if (newSch) Sch.changeType(store, textArea._treeItem.id, newSch)
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

  deleteSelected_(tree, store)
  tree._render()
  AriaTree.selectNode(tree, nextStepNode)
}
const deleteSelected_ = (tree, store) => {
  const indicesPerParent = AriaTree.selectedGroupedByParent(tree)

  for (let parentPath of Object.keys(indicesPerParent))
    Sch.pop(store, parentPath, indicesPerParent[parentPath].map(c => c.index))
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
  // if (dstSch.paste?.deny.includes(dstSch._box)) return

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

    if (Object.keys(result).length != 0) {
      tree._render()
      AriaTree.clearClipboard(tree)
      AriaTree.reselectNodes(tree, result)
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
    tree._render()
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
    tree._render()
    AriaTree.reselectNodes(tree, moved, { direction })
  }
}

const component = ({ store, target, metaSelector, opts }) => {
  store.render = (s) => View.renderRoot(target, s || store, opts || {})
  store.render()

  let tree = document.querySelector(`${target} [role='tree']`)
  let metaContainer = document.querySelector(metaSelector)

  if (tree) {
    tree._aria = AriaTree
    tree._render = store.render
    AriaTree.createWalker(tree)
    tree.onkeydown = handleTreeKeydown(store, opts.treeKeyDownOpts)
    tree.onclick = handleTreeClick(store)

    let rootNode = tree._walker.nextNode()
    AriaTree.selectNode(tree, tree._walker.nextNode() || rootNode, { focus: opts.focus })

    if (metaSelector)
      tree._metaContainer = metaContainer

    tree.renderSchMeta = () => renderSchMeta({ tree, store: store })
    tree.renderSchMeta()
  }
}
const initFileView = ({ store, target, metaSelector }) => {
  component({
    store, target, metaSelector,
    opts: {
      ui: {
        depthLimit: 2,
        modelTypeText: (sch, ui) => "file",
        typeText: (sch, ui) => {
          if (sch.type == T.RECORD) return "record"
          else if (sch.type == T.VALUE) return "value"
          else if (sch.type == T.TUPLE) return "tuple"
          else if (sch.type == T.UNION) return "union"
        },
        viewTypeRoot: (a) => ``
      },
      treeKeyDownOpts: { denyCmds: ["activateEditType", "copy", "cut", "paste"] },
      focus: true
    }
  })
}
const initModelView = ({ store, target, metaSelector }) => {
  component({
    store, target, metaSelector,
    opts: {
      ui: { modelTypeText: (sch, ui) => "type" }
    }
  })
}

const update = ({ store, detail, target }) => {
  let { path, attrs } = detail
  let sch = Sch.update(store, path, (a, m) => SchMeta.save(a, attrs))

  store.render()
  View.renderMeta(target.closest("sch-meta"), sch, store)
}
