import * as AriaTree from "../aria_tree.js"
import { clickSelect as clickSelect_ } from "../actions.js"

export const selectMultiNodeUpTo = ({ tree }) => {
  let current = tree._walker.currentNode
  let upEnd = tree._walker.parentNode() && tree._walker.firstChild()
  AriaTree.selectMultiNodeTo(tree, current, upEnd)
}
export const selectMultiNodeDownTo = ({ tree }) => {
  let current = tree._walker.currentNode
  let downEnd = tree._walker.parentNode() && tree._walker.lastChild()
  AriaTree.selectMultiNodeTo(tree, current, downEnd)
}
export const selectMultiNodeUp = ({ tree }) => {
  let current = tree._walker.currentNode
  let upNext = tree._walker.previousSibling()
  AriaTree.selectMultiNode(current, upNext)
}
export const selectMultiNodeDown = ({ tree }) => {
  let current = tree._walker.currentNode
  let downNext = tree._walker.nextSibling()
  AriaTree.selectMultiNode(current, downNext)
}
export const selectUpEnd = ({ tree }) => {
  let upEnd = tree._walker.parentNode() && tree._walker.firstChild()
  AriaTree.selectNode(tree, upEnd)
}
export const selectDownEnd = ({ tree }) => {
  let upEnd = tree._walker.parentNode() && tree._walker.lastChild()
  AriaTree.selectNode(tree, upEnd)
}
export const selectPrevious = ({ tree }) =>
  AriaTree.selectNode(tree, tree._walker.previousSibling())
export const selectNext = ({ tree }) =>
  AriaTree.selectNode(tree, tree._walker.nextSibling())
export const selectUp = ({ tree }) =>
  AriaTree.selectNode(tree, tree._walker.previousNode())
export const selectDown = ({ tree }) =>
  AriaTree.selectNode(tree, tree._walker.nextNode())

export const selectRoot = ({ tree }) => {
  while (tree._walker.parentNode()) { }
  // Root item is not in a scroll container, we walk to the first element of container
  // to trigger scrollTop to 0, and then walk back up.

  // Latest thought: the above explanation is old and obsolute, however why it is explained
  // like that in the first place is mysterious.
  AriaTree.selectNode(tree, tree._walker.nextNode())
}
export const selectLast = ({ tree }) => {
  while (tree._walker.nextNode()) { }
  AriaTree.selectNode(tree, tree._walker.currentNode)
}

export const clickSelect = ({ e, tree, store }) => {
  e.stopPropagation()
  let start = tree._walker.currentNode
  let target = e.target.closest("[role='treeitem']")
  let cmd = e.target.dataset.cmd

  if (!target) return
  if (e.shiftKey || e.metaKey)
    switch (start.compareDocumentPosition(target)) {
      case Node.DOCUMENT_POSITION_CONTAINS:
        return AriaTree.selectNode(tree, target)
      case Node.DOCUMENT_POSITION_CONTAINED_BY:
        return AriaTree.selectNode(tree, start)
      default:
        if (target.parentNode.closest("[role='treeitem']") != start.parentNode.closest("[role='treeitem']"))
          return AriaTree.selectNode(tree, target)
    }

  if (e.shiftKey) {
    if (start != target) document.getSelection().removeAllRanges();
    AriaTree.selectMultiNodeTo(tree, start, target)
  }
  else if (e.metaKey)
    AriaTree.toggleSelectNode(start, tree._walker.currentNode = target)
  else if (!cmd) {
    tree._walker.currentNode = target

    clickSelect_({ tree }, { focus: e.target != document.activeElement })
    store.currentNode = tree._walker.currentNode
  }
}

export const preventDefaultScroll = ({ e }) => {
  switch (e.code) {
    case "ArrowUp": e.preventDefault(); break
    case "ArrowDown": e.preventDefault(); break
  }
}
