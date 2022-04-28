import * as Sch from "./sch.js"
import * as Core from "./pkgs/core.js"
import * as AriaTree from "./aria_tree.js"
import { readable } from "./utils.js"

export {
  Selects,

  // Basic ops
  addSch,
  addFile,
  addFolder,
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
  clickSelect,

  expandSelected,
  collapseSelected,

  // utils
  preCompileCheck,
  currentParent,

  // html
  activateEditText,
  unwrapAfter,
  wrapBefore
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
const selectPrevious = ({ tree }) =>
  AriaTree.selectNode(tree, tree._walker.previousSibling())
const selectNext = ({ tree }) =>
  AriaTree.selectNode(tree, tree._walker.nextSibling())
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
const escapeEdit = ({ tree, store }, textArea) =>
  cancelTextArea(tree, store, textArea)

const Selects = {
  selectMultiNodeUpTo,
  selectMultiNodeDownTo,
  selectMultiNodeUp,
  selectMultiNodeDown,
  selectUpEnd,
  selectDownEnd,
  selectUp,
  selectDown,
  selectPrevious,
  selectNext,
  selectRoot,
  selectLast
}

/* Basic ops */

const addSch = ({ tree, store, e }) => {
  let currentNode = tree._walker.currentNode
  let index

  let childrenRules_ = suggestChildren(tree, store)
  if (!childrenRules_) return

  let defaultSch =
    childrenRules_.allowedSchs[e.target.defaultSch] ||
    childrenRules_.allowedSchs[childrenRules_.defaultSch] ||
    childrenRules_.allowedSchs[0]
  if (!defaultSch) return

  if (store.put?.pos == "prepend") index = 0
  else index = Number.MAX_SAFE_INTEGER
  Sch.put(store, currentNode.id, [{ k: defaultSch.key || null, sch: () => Sch.clone(defaultSch), index: index }])

  tree._render(store)
  AriaTree.selectNode(tree, currentNode)
}
const addFile = (arg) => addSch(arg)
const addFolder = (arg) => addSch(arg)

const activateEditText = ({ tree, store, e }) => {
  e.preventDefault()
  let currentNode = tree._walker.currentNode
  let textRect = currentNode.querySelector(".k")
  if (textRect)
    activateEdit({ tree, store, editMode: "editKey", textRect })
}
const activateEditKey = ({ tree, store, e }) => {
  e.preventDefault()
  let currentNode = tree._walker.currentNode
  let group = currentNode.closest("[role='group']")?.dataset?.group
  if (group == "keyed") {
    let textRect = currentNode.querySelector(".k")
    if (textRect)
      activateEdit({ tree, store, editMode: "editKey", textRect })
  }
}
const activateEditType = ({ tree, store, e }) => {
  e?.preventDefault()

  let textRect = tree._walker.currentNode.querySelector(".t")
  let allowedTs = suggestSchsFitParent(tree, store)

  if (textRect)
    activateEdit({ tree, store, e, editMode: "editType", textRect, opts: { allowedTs } })
}
const activateEdit = ({ tree, store, e, editMode, textRect, opts = {} }) => {
  let currentNode = tree._walker.currentNode
  // Get pre-edit mode text style to be used for textrea
  const tbeforeWidth = Number.parseFloat(window.getComputedStyle(textRect, ":before").width)
  const tafterWidth = Number.parseFloat(window.getComputedStyle(textRect, ":after").width)
  let rectWidth = Number.parseFloat(window.getComputedStyle(textRect).width)
  textRect = textRect.getBoundingClientRect()
  if (tbeforeWidth) rectWidth -= tbeforeWidth
  if (tafterWidth) rectWidth -= tafterWidth

  const sch = Sch.update(store, currentNode.id, (a, m) => readable(a, "uiMode", editMode))
  tree._render(store)

  let textArea = tree.querySelector("textarea")
  if (!textArea) return

  textArea.style.width = rectWidth + "px"
  textArea.style.minWidth = rectWidth + "px"
  textArea.style.minHeight = textRect.height + "px"

  textArea._treeItem = currentNode
  textArea.opts = opts
  textArea.onblur = e => e.relatedTarget && e.relatedTarget.id != textArea._treeItem.id && cancelTextArea(tree, store, textArea)
  textArea.focus()
}
const cancelTextArea = (tree, store, textArea) => {
  let updatedNode = Sch.update(store, textArea._treeItem.id, (a, m) => readable(a, "uiMode", "cancelled-edit"))

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

  Sch.update(store, currentId, (a, m) => readable(a, "uiMode", "editted"))
  tree._render(store)

  tree._walker.currentNode = tree.querySelector(`[id='${CSS.escape(currentId)}']`)
  AriaTree.selectNode(tree, tree._walker.currentNode)
}
const changeTypeSelected = (tree, store, textArea) => {
  const allowedSchs_ = suggestSchsFitParent(tree, store)
  const toStr = sch_ => store.structSheet[sch_.m].toStr(sch_.t)

  let allowedSch = allowedSchs_.find(sch_ => toStr(sch_) == textArea.value)
  let anchor = store._models[textArea.value] && textArea.value || Object.keys(store._models).find(anchor => {
    const model = store._models[anchor]
    const modelExisted = store._models[anchor].display == textArea.value
    if (!modelExisted) return false

    return Core.legitTs(allowedSchs_, model)
  })
  let valSch = Core.value(textArea.value)

  if (allowedSch) Sch.changeType(store, textArea._treeItem.id, () => Sch.clone(allowedSch))
  else if (anchor) Sch.changeType(store, textArea._treeItem.id, () => Core.ref(anchor))
  else if (valSch) Sch.changeType(store, textArea._treeItem.id, () => valSch)
  return tree._walker.currentNode.id
}
const renameSelected = (tree, store, textArea) => {
  let indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let dstPath = textArea.dataset.parentPath

  indicesPerParent[textArea.dataset.parentPath] =
    indicesPerParent[textArea.dataset.parentPath]
      .filter(c => c.id == textArea._treeItem.id)
      .map(c => Object.assign(c, { newK: textArea.value }))

  let renameIndex = indicesPerParent[textArea.dataset.parentPath][0].index
  let moved = Sch.move(store, { dstPath, startIndex: renameIndex, isRefConstraint: false }, indicesPerParent)

  let newKey = moved[dstPath][0].k
  let ancestor = textArea._treeItem.parentNode.closest("[role='treeitem']")
  return `${ancestor.id}[${newKey}]`
}

const deleteSelected = ({ tree, store }) => {
  let currentNode = tree._walker.currentNode
  let nextStepNode =
    AriaTree.findUnselectedNode(() => tree._walker.nextSibling()) ||
    AriaTree.findUnselectedNode(() => tree._walker.previousSibling()) ||
    AriaTree.findUnselectedNode(() => tree._walker.parentNode())

  Sch.popToRawSchs(store, AriaTree.selectedGroupedByParent(tree))
  tree._render(store)
  if (currentNode.getAttribute("data-err") == "ref")
    tree._walker.currentNode = currentNode
  else
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
    srcStore: store,
    ops: ({ dstPath, dstLevel, dstStore }) => Sch.popToRawSchs(store, selectedPerParent, { dstPath, dstLevel, dstStore }),
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
    srcStore: store,
    ops: ({ dstPath }) => Sch.copyToRawSchs(store, selectedPerParent, { dstPath, startIndex: 0 }),
    selected: selectedPerParent
  }
}
const paste = ({ tree, store, srcStore }) => {
  const dstSch = Sch.get(store, tree._walker.currentNode.id)
  if (!(dstSch.hasOwnProperty("fields") || dstSch.hasOwnProperty("schs") || dstSch.hasOwnProperty("sch")))
    return

  const allowedSchs_ = suggestChildren(tree, store)?.allowedSchs
  if (!allowedSchs_)
    return

  if (window._treeClipboard) {
    let dstPath = tree._walker.currentNode.id
    const { type, srcStore, ops, selected } = window._treeClipboard
    let selectedPerParent = selected
    let result = {}

    // are copied or cut items allowed to be pasted as children of currentSch?
    for (let items of Object.values(selectedPerParent))
      for (let item of items)
        if (!allowedSchs_.map(a => a.t).includes(item.sch.t)) return

    if (store.key == srcStore.key)
      switch (type) {
        case "copy":
          result = Sch.putSelected(store, { dstPath }, selectedPerParent)
          break
        case "cut":
          result = Sch.move(store, { dstPath, dstLevel: dstSch._meta.level, dstStore: store }, selectedPerParent)
          break
      }
    else
      switch (type) {
        case "copy":
          let rawSchs = ops({ dstPath: "" })
          result = Sch.putSelectedRawSchs(store, { dstPath }, rawSchs)
          break
        case "cut":
          let poppedPerSrc = ops({ dstPath: "", dstLevel: dstSch._meta.level, dstStore: store })
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
  cloneSelected({ tree, store, direction: "" }, (ascSelected) => ascSelected[0].index)
const cloneDown = ({ tree, store }) =>
  cloneSelected({ tree, store, direction: "" }, (ascSelected) => ascSelected[ascSelected.length - 1].index + 1)
const cloneSelected = ({ tree, store, direction }, fStartIndex) => {
  let indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let result = {}

  for (let dstPath of Object.keys(indicesPerParent))
    result = Sch.putSelected(store,
      { dstPath, startIndex: fStartIndex(indicesPerParent[dstPath]) },
      { [dstPath]: indicesPerParent[dstPath] })

  if (Object.keys(result).length != 0) {
    tree._render(store)
    AriaTree.reselectNodes(tree, result, { direction, sync: !!tree.sync })
  }
}

const reorderUp = ({ tree, store }) =>
  reorder({ tree, store, startIndex: i => i - 1, direction: "" })
const reorderDown = ({ tree, store }) =>
  reorder({ tree, store, startIndex: i => i + 1, direction: "" })
const reorder = ({ tree, store, startIndex, direction }) => {
  const indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let moved = {}

  for (let dstPath of Object.keys(indicesPerParent)) {
    let ascSelected = indicesPerParent[dstPath].sort((a, b) => a.index - b.index)
    moved = Sch.move(store, { dstPath, startIndex: startIndex(ascSelected[0].index), isRefConstraint: false }, indicesPerParent)
  }

  if (Object.keys(moved).length != 0) {
    tree._render(store)
    AriaTree.reselectNodes(tree, moved)
  }
}
/* TODO:
  1. Cover edge case (root bound throw exception)
*/
const unwrapAfter = ({ tree, store }) => {
  const indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let moved = {}

  for (let srcPath of Object.keys(indicesPerParent)) {
    let parent = Sch.get(store, srcPath)
    let parentParent = Sch.get(store, parent._meta.parent.path)

    moved = Sch.move(store, {
      dstPath: parentParent._meta.path,
      startIndex: parent._meta.index + 1,
      isRefConstraint: false
    },
      indicesPerParent)
  }

  if (Object.keys(moved).length != 0) {
    tree._render(store)
    AriaTree.reselectNodes(tree, moved)
  }
}
/* TODO:
  1.Cover egde cases
    - can't wrap in text node
    - no previou sibling
  2.Performance: popToRawSchs perf is fine but not great for 7000+ nodes
*/
const wrapBefore = ({ tree, store }) => {
  const indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let moved = {}

  for (let srcPath of Object.keys(indicesPerParent)) {
    let ascSelected = indicesPerParent[srcPath].sort((a, b) => a.index - b.index)
    let previousSibling = ascSelected[0].previousElementSibling

    moved = Sch.move(store, {
      dstPath: previousSibling.id,
      startIndex: Number.MAX_SAFE_INTEGER,
      isRefConstraint: false
    },
      indicesPerParent)
  }

  if (Object.keys(moved).length != 0) {
    tree._render(store)
    AriaTree.reselectNodes(tree, moved)
  }
}

const currentParent = (tree, store) => {
  let parentItem = tree._walker.currentNode.parentNode.closest("[role='treeitem']")
  let isRoot = tree._walker.currentNode.classList.contains("root-item")

  if (isRoot) parentItem = tree._walker.currentNode
  if (!parentItem) return
  let parentSch = Sch.get(store, parentItem.id)

  let currentItem = tree._walker.currentNode
  let currentSch = Sch.get(store, currentItem.id)

  return { parentSch, currentSch }
}

// return list of allowed schs or null
const suggestChildren = (tree, store) => {
  let { currentSch } = currentParent(tree, store)
  const { m, t } = currentSch
  const currentRule = store.structSheet[m].sheet(t)
  const nextIndex = (currentSch.fields || currentSch.schs || { length: 1 }).length

  switch (true) {
    case !!currentRule.nthChild:
      return currentRule.nthChild[nextIndex]
    case !!currentRule.children:
      return currentRule.children
    default:
      return null
  }
}

const suggestSchsFitParent = (tree, store) => {
  let { parentSch, currentSch } = currentParent(tree, store)
  const { m, t } = parentSch
  const parentRule = store.structSheet[m].sheet(t)

  switch (true) {
    case !!parentRule.nthChild:
      return parentRule.nthChild[currentSch._meta.index].allowedSchs
    case !!parentRule.children:
      return parentRule.children.allowedSchs
    default:
      return null
  }
}

const preCompileCheck = (tree, store) => {
  const sheet = ({ m, t }) => store.structSheet[m].sheet(t)
  const allow = (allow_, current) => allow_.m == current.m && allow_.t == current.t
  const annotate = (parentRule, current) => {
    const nthChildren = parentRule?.nthChild?.[current._local.index]?.allowedSchs
    const children = parentRule?.children?.allowedSchs

    if (nthChildren)
      if (!nthChildren.find(a => allow(a, current)))
        Object.assign(current, { terror: nthChildren })
    if (children)
      if (!children.find(a => allow(a, current)))
        Object.assign(current, { terror: children })

    return current
  }
  // annotate compile error just for parent-child scope,
  // it should be function scope (walk up to it and walk check)
  Sch.walk(store, (a, meta) => {
    readable(a, "_local", meta)

    let { m, t } = meta.parent
    if (m && t) {
      let parentRule = sheet(meta.parent)
      if (parentRule) a = annotate(parentRule, a)
    }

    return a
  })
}

/* Assist viewing tree */
const expandSelected = ({ tree }) => AriaTree.expandSelected(tree)
const collapseSelected = ({ tree }) => AriaTree.collapseSelected(tree)
