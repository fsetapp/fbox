export {
  createWalker,
  selectNode, selectMultiNode, selectMultiNodeTo, selectStepNodeTo, reselectNodes, selectedGroupedByParent, findUnselectedNode,
  clearClipboard
}

const ARIA_SELECTED = "aria-selected"

const createWalker = (tree) => {
  tree._walker = tree.ownerDocument.createTreeWalker(
    tree,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (node.hasAttribute(ARIA_SELECTED)) return NodeFilter.FILTER_ACCEPT
        else return NodeFilter.FILTER_SKIP
      }
    },
    false)
  return tree
}

const selectNode = (tree, currentNode, nextStepNode, opts = { focus: true }) => {
  if (nextStepNode) {
    deselectAllNode(tree)
    selectMultiNode(currentNode, nextStepNode, opts)
  }
}

const deselectAllNode = (tree) => {
  for (let item of tree.querySelectorAll(`[${ARIA_SELECTED}='true']`))
    setDeselect(item)

  for (let a of tree.querySelectorAll(".item-pasted"))
    a.classList.remove("item-pasted")
}

const selectMultiNode = (currentNode, nextStepNode, opts = { focus: true }) => {
  if (nextStepNode) {
    if (nextStepNode.getAttribute(ARIA_SELECTED) == "true")
      setDeselect(currentNode)

    setSelect(nextStepNode)
    opts.focus && nextStepNode.focus()
  }
}

const selectStepNodeTo = (tree, nextStepSibling, targetNode) => {
  let currentNode
  let nextStepSibling_

  do {
    currentNode = tree._walker.currentNode
    nextStepSibling_ = nextStepSibling()
    selectMultiNode(currentNode, nextStepSibling_, { focus: false })
  }
  while (nextStepSibling_ && nextStepSibling_ != targetNode)
}

const selectMultiNodeTo = (tree, startNode, targetNode) => {
  switch (startNode.compareDocumentPosition(targetNode)) {
    case Node.DOCUMENT_POSITION_FOLLOWING:
      selectNode(tree, startNode, startNode)

      tree._walker.currentNode = startNode
      selectStepNodeTo(tree, () => tree._walker.nextSibling(), targetNode)
      break

    case Node.DOCUMENT_POSITION_PRECEDING:
      selectNode(tree, targetNode, targetNode)
      /* Don't do tree._walker.previousSibling() because Firefox is slow at re-painting
        applied style in bottom-to-top direction.
      */
      tree._walker.currentNode = targetNode
      selectStepNodeTo(tree, () => tree._walker.nextSibling(), startNode)
      break
  }

  tree._walker.currentNode = startNode
  targetNode.focus()
}

const setSelect = (node) => {
  node?.setAttribute(ARIA_SELECTED, true)
  node?.setAttribute("tabindex", 0)
}
const setDeselect = (node) => {
  node?.setAttribute(ARIA_SELECTED, false)
  node?.setAttribute("tabindex", -1)
}

const findUnselectedNode = (fstep, nextNode) => {
  do nextNode = fstep()
  while (nextNode?.getAttribute(ARIA_SELECTED) == "true")
  return nextNode
}

const filterMostOuters = (paths) => {
  return paths.filter(p => {
    for (let p_ of paths) {
      if (p == p_) return true
      else if (p.startsWith(p_)) return false
    }
  })
}

const reselectNodes = (tree, childIncidesPerParent) => {
  deselectAllNode(tree)

  for (let parent of filterMostOuters(Object.keys(childIncidesPerParent))) {
    let indices = childIncidesPerParent[parent]

    parent = tree.querySelector(`[id='${CSS.escape(parent)}'][aria-level]`)
    if (!parent) continue
    let dstLevel = parseInt(parent.getAttribute("aria-level"))
    let children = parent.querySelectorAll(`[aria-level='${dstLevel + 1}'][role='treeitem']`)

    indices.map(({ index }) => children[index]).forEach(a => {
      a.classList.add("item-pasted")
      selectMultiNode(tree, a)
      tree._walker.currentNode = a
    })
  }
}

const selectedGroupedByParent = (tree, opts = {}) =>
  [...tree.querySelectorAll(`${opts.ops || `[${ARIA_SELECTED}='true']`}`)].reduce((acc, child) => {
    let parent = child.parentNode.closest("[role='treeitem']")
    if (!parent) return acc

    let parentLevel = parseInt(parent.getAttribute("aria-level"))
    let children = parent.querySelectorAll(`[aria-level='${parentLevel + 1}'][role='treeitem']`)

    child.index = [...children].indexOf(child)
    acc[parent.id] = acc[parent.id] || []
    acc[parent.id].push(child)
    return acc
  }, {})

const clearClipboard = (tree) => {
  tree.querySelectorAll(".item-cutting").forEach(a => a.classList.remove("item-cutting"))
  tree._clipboard = null
}
