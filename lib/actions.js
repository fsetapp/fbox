import * as Sch from "./sch.js"
import * as Core from "./pkgs/core.js"
import * as AriaTree from "./aria_tree.js"
import { readable } from "./utils.js"
import * as Selects from "./actions/select.js"

export {
  Selects,

  // Basic ops
  addSch,
  addFile,
  addFolder,
  addDataCtor,
  activateEditKey,
  activateEditType,
  activateEditTarget,
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
  editSelected,
  escapeEdit,
  clickSelect,

  expandSelected,
  collapseSelected,
  toggleExpandCollapse,
  clearClipboard,

  // utils
  preCompileCheck,
  currentParent,

  // html
  activateEditText,
  unwrapAfter,
  wrapBefore,
  insertAfter
}

const clickSelect = ({ tree }, opts = {}) =>
  AriaTree.selectNode(tree, tree._walker.currentNode, opts)

const escapeEdit = ({ tree, store, e }) =>
  cancelTextArea(tree, store, e.target)

/* Basic ops */

const addSch = ({ tree, store, e }) => {
  let currentNode = tree._walker.currentNode
  let index

  let { anyOf, put, defaultSch } = suggestChildren(tree, store)
  if (!anyOf) return

  let putSch
  if (typeof e.target.putSch == "function") {
    putSch = anyOf.find(a => Sch.is(a, e.target.putSch()))
  }
  else
    putSch =
      anyOf[e.target.putSch] ||
      anyOf[defaultSch] ||
      anyOf[0]

  if (!putSch) return

  if (put?.pos == "append") index = Number.MAX_SAFE_INTEGER
  else index = 0
  Sch.put(store, currentNode.id, [{ k: putSch.key || null, sch: () => Sch.clone(putSch), index: index }])

  tree._render(store)
  AriaTree.selectNode(tree, currentNode)
}
const addFile = (arg) => addSch(arg)
const addFolder = (arg) => addSch(arg)
const addDataCtor = (arg) => addSch(arg)

const activateEditTarget = context => {
  switch (true) {
    case context.e.target.matches(".k"): activateEditKey(context); break
    case context.e.target.matches(".t"): activateEditType(context); break
    case context.e.target.matches(".v"): activateEditText(context); break
  }
}

const activateEditText = ({ tree, store, e }) =>
  activateEdit({ tree, store, e, editMode: "editVal", which: ".v" })

const activateEditKey = ({ tree, store, e }) =>
  activateEdit({ tree, store, e, editMode: "editKey", which: ".k" })

const activateEditType = ({ tree, store, e }) =>
  activateEdit({ tree, store, e, editMode: "editType", which: ".t" })

const activateEdit = ({ tree, store, e, editMode, which, opts = {} }) => {
  let textRect = tree._walker.currentNode.querySelector(which)
  if (!textRect) return
  e?.preventDefault()

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

const submitEdit = ({ tree, store, e }) => {
  let textArea = e.target
  if (textArea.id == "key-edit") editSelected(tree, store, textArea, renameSelected)
  else if (textArea.id == "val-edit") editSelected(tree, store, textArea, changeVSelected)
  else if (textArea.id == "type-edit") editSelected(tree, store, textArea, changeTSelected)
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
const changeTSelected = (tree, store, textArea) => {
  const allowedSchs_ = suggestSchsFitParent(tree, store) || []
  const toStr = sch_ => store.structSheet[sch_.m].toStr[sch_.t]
  const castVal = sch_ => store.structSheet[sch_.m].toVal || ((a, b) => false)

  let allowedSch = allowedSchs_.find(sch_ => toStr(sch_) == textArea.value)
  allowedSch ||= allowedSchs_.reduce((acc, sch_) => {
    let valSch = castVal(sch_)(sch_, textArea.value)
    if (valSch) return valSch
    else return acc
  }, false)

  let anchor = store._models && Object.keys(store._models).find(anchor => {
    const top = store._models[anchor]
    const foundTop = store._models[anchor].display == textArea.value
    if (!foundTop) return false

    return Core.containsRefTo(allowedSchs_, top)
  })
  if (anchor) Sch.changeT(store, textArea._treeItem.id, () => Core.ref(anchor))
  else if (allowedSch) Sch.changeT(store, textArea._treeItem.id, () => Sch.clone(allowedSch))
  return tree._walker.currentNode.id
}
const renameSelected = (tree, store, textArea) => {
  let indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let dstId = textArea.dataset.parentId

  indicesPerParent[dstId] =
    indicesPerParent[dstId]
      .filter(c => c.id == textArea._treeItem.id)
      .map(c => Object.assign(c, { newK: textArea.value }))

  let renameIndex = indicesPerParent[dstId][0].index
  let moved = Sch.move(store, { dstId, startIndex: renameIndex, isRefConstraint: false }, indicesPerParent)
  return moved[dstId][0].sch.$a
}
const changeVSelected = (tree, store, textArea) => {
  const toVal = sch_ => store.structSheet[sch_.m].toVal || ((a, b) => false)
  const itemSch = textArea._treeItem.sch

  let allowedSch = toVal(itemSch)(itemSch, textArea.value)
  if (allowedSch) {
    Sch.changeT(store, textArea._treeItem.id, () => Sch.clone(allowedSch))
  }

  return tree._walker.currentNode.id
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
const clearClipboard = ({ tree, e }) => {
  AriaTree.clearClipboard(tree)
  if (e.target instanceof HTMLInputElement)
    AriaTree.selectNode(tree, tree._walker.currentNode)
}

const cut = ({ store, tree }) => {
  AriaTree.clearClipboard(tree)

  for (let a of tree.querySelectorAll("[aria-selected='true']")) a.classList.add("item-cutting")
  let selectedPerParent = AriaTree.selectedGroupedByParent(tree, { ops: ".item-cutting" })

  window._treeClipboard = {
    type: "cut",
    srcStore: store,
    ops: ({ dstId, dstLevel, dstStore }) => Sch.popToRawSchs(store, selectedPerParent, { dstId, dstLevel, dstStore }),
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
    ops: ({ dstId }) => Sch.copyToRawSchs(store, selectedPerParent, { dstId, startIndex: 0 }),
    selected: selectedPerParent
  }
}

const isEmpty = sch => sch?.fields?.length == 0 || sch?.schs?.length == 0
const paste = ({ tree, store, srcStore }) => {
  const dstSch = Sch.get(store, tree._walker.currentNode.id)
  if (!dstSch || !Sch.isContainer(dstSch))
    return

  const allowedSchs_ = suggestChildren(tree, store).anyOf
  if (!allowedSchs_)
    return

  if (window._treeClipboard) {
    let dstId = tree._walker.currentNode.id
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
          result = Sch.putSelected(store, { dstId }, selectedPerParent)
          break
        case "cut":
          result = Sch.move(store, { dstId, dstLevel: dstSch._meta.level, dstStore: store }, selectedPerParent)
          break
      }
    else
      switch (type) {
        case "copy":
          let rawSchs = ops({ dstId: "" })
          result = Sch.putSelectedRawSchs(store, { dstId }, rawSchs)
          break
        case "cut":
          let poppedPerSrc = ops({ dstId: "", dstLevel: dstSch._meta.level, dstStore: store })
          result = Sch.putPoppedRawSchs(store, { dstId }, poppedPerSrc)
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

  for (let dstId of Object.keys(indicesPerParent))
    result = Sch.putSelected(store,
      { dstId, startIndex: fStartIndex(indicesPerParent[dstId]) },
      { [dstId]: indicesPerParent[dstId] })

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

  for (let dstId of Object.keys(indicesPerParent)) {
    let ascSelected = indicesPerParent[dstId].sort((a, b) => a.index - b.index)
    moved = Sch.move(store, { dstId, startIndex: startIndex(ascSelected[0].index), isRefConstraint: false }, indicesPerParent)
  }

  if (Object.keys(moved).length != 0) {
    tree._render(store)
    AriaTree.reselectNodes(tree, moved)
  }
}

const insertAfter = ({ tree, store }, sch) =>
  multiParentsOp({ tree, store, sort: "desc" }, (pPath, grouped, { sorted }) => {
    if (!sch) return

    let currentSch = tree._walker.currentNode.sch
    let result
    let where = {}
    if (Sch.isContainer(currentSch) && !isEmpty(currentSch) && tree._walker.currentNode.getAttribute("aria-expanded") == "true")
      Object.assign(where, { dst: tree._walker.currentNode.id, index: 0 })
    else
      Object.assign(where, { dst: pPath, index: sorted[0].index + 1 })

    result = Sch.put(store, where.dst, [{ k: null, sch, index: where.index }])
    return { [where.dst]: result.inserted }
  })

const unwrapAfter = ({ tree, store }) =>
  multiParentsOp({ tree, store }, (pPath, grouped) => {
    let parent = Sch.get(store, pPath)
    let parentParent = Sch.get(store, parent._meta.parent.$a)
    if (!parentParent) return {}
    return Sch.move(store, {
      dstId: parentParent.$a,
      startIndex: parent._meta.index + 1,
      isRefConstraint: false
    },
      grouped)
  })

/* TODO:
  2.Performance: popToRawSchs perf is fine but not great for 7000+ nodes
*/

const wrapBefore = ({ tree, store }) =>
  multiParentsOp({ tree, store, sort: "asc" }, (pPath, grouped, { sorted }) => {
    if (!sorted[0].previousElementSibling?.sch) return {}
    if (!Sch.isContainer(sorted[0].previousElementSibling.sch)) return {}
    return Sch.move(store, {
      dstId: sorted[0].previousElementSibling.id,
      startIndex: Number.MAX_SAFE_INTEGER,
      isRefConstraint: false
    },
      grouped)
  })


const multiParentsOp = ({ tree, store, sort }, f) => {
  const indicesPerParent = AriaTree.selectedGroupedByParent(tree)
  let result = {}

  for (let srcId of Object.keys(indicesPerParent)) {
    let sorted
    if (sort == "asc") sorted = indicesPerParent[srcId].sort((a, b) => a.index - b.index)
    else if (sort == "desc") sorted = indicesPerParent[srcId].sort((a, b) => b.index - a.index)

    result = f(srcId, indicesPerParent, { sorted })
  }

  if (Object.keys(result).length != 0) {
    tree._render(store)
    AriaTree.reselectNodes(tree, result)
  }
}

const currentParent = (tree, store) => {
  let parentItem = tree._walker.currentNode.parentNode.closest("[role='treeitem']")
  let isRoot = tree._walker.currentNode.classList.contains("root-item")

  if (isRoot) parentItem = tree._walker.currentNode
  if (!parentItem) return
  let parentSch = parentItem.sch
  parentSch.index = parentItem.index

  let currentItem = tree._walker.currentNode
  let currentSch = currentItem.sch
  currentSch.index = currentItem.index

  return { parentSch, currentSch }
}

// used for action on parent
const suggestChildren = (tree, store) => {
  let { currentSch } = currentParent(tree, store)
  const { m, t } = currentSch
  const structSheet = store.structSheet[m]
  const currentRule = structSheet.sheet[t] || structSheet.sheet.default
  const nextChildIndex = (currentSch.fields || currentSch.schs || { length: 1 }).length

  return suggest(currentRule, nextChildIndex)
}
// used for action on children
const suggestSchsFitParent = (tree, store) => {
  let { parentSch, currentSch } = currentParent(tree, store)
  const { m, t } = parentSch
  const parentRule = store.structSheet[m].sheet[t] || store.structSheet[m].sheet.default

  return suggest(parentRule, currentSch.index)?.anyOf
}
const suggest = (rule, childIndex) => {
  switch (true) {
    case !!rule?.nthChild:
      return rule.nthChild[childIndex] || rule.children || {}
    case !!rule?.children:
      return rule.children || {}
    default:
      return {}
  }
}
const preCompileCheck = (tree, store) => {
  const sheet = ({ m, t }) => store.structSheet[m].sheet[t] || store.structSheet[m].sheet.default
  const allow = (allow_, current) => allow_.m == current.m && allow_.t == current.t
  const annotate = (parentRule, current) => {
    const nthChildren = parentRule?.nthChild?.[current._local.index]?.anyOf
    const children = parentRule?.children?.anyOf

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
const toggleExpandCollapse = ({ e, tree }) => {
  if (e.shiftKey || e.metaKey || e.ctrlKey) return
  let targetNode = e.target.closest("[aria-expanded]")
  if (targetNode) tree._walker.currentNode = targetNode

  AriaTree.selectNode(tree, tree._walker.currentNode)
  AriaTree.toggleExpandCollapse(tree)
}
