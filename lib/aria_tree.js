export {
  createWalker,
  selectNode, selectMultiNode, selectMultiNodeTo, toggleSelectNode, reselectNodes, selectedGroupedByParent, findUnselectedNode,
  clearClipboard, expandSelected, collapseSelected
}

const ARIA_SELECTED = "aria-selected"
const ARIA_EXPANDED = "aria-expanded"

const createWalker = (tree) => {
  tree._walker = tree.ownerDocument.createTreeWalker(
    tree,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        if (node.hasAttribute(ARIA_SELECTED)) {
          let parentExpanded = node.parentElement.closest(`[${ARIA_EXPANDED}]`)?.getAttribute(ARIA_EXPANDED)
          if (parentExpanded && parentExpanded == "false")
            return NodeFilter.FILTER_REJECT
          else
            return NodeFilter.FILTER_ACCEPT
        }
        else
          return NodeFilter.FILTER_SKIP
      }
    },
    false)
  return tree
}

const selectNode = (tree, node, opts = { focus: true }) => {
  if (node && !node.isConnected) node = tree.querySelector(`[id='${CSS.escape(node.id)}']`)
  if (!node) return
  tree._walker.currentNode = node

  deselectAllNode(tree)
  setSelect(node)
  opts.focus && node.focus()
}

const toggleSelectNode = (current, node) => {

  if (current) current.tabIndex = -1
  setToggle(node)
}

const selectMultiNode = (current, nextStepSibling, opts = { focus: true }) => {
  if (!nextStepSibling) return

  if (current) current.tabIndex = -1
  if (nextStepSibling.getAttribute(ARIA_SELECTED) == "true")
    setToggle(current)
  else
    setSelect(nextStepSibling)

  opts.focus && nextStepSibling.focus()
}

const deselectAllNode = (tree) => {
  for (let item of tree.querySelectorAll(`[${ARIA_SELECTED}='true']`))
    setDeselect(item)

  for (let a of tree.querySelectorAll(".item-pasted"))
    a.classList.remove("item-pasted", "up", "down")
}

const selectStepNodeTo = (tree, stepSiblingFn, target, opts = {}) => {
  let current = tree._walker.currentNode
  let nextSibling = stepSiblingFn()

  if (!nextSibling) return
  if (current == target) return opts.target?.call(null, target)
  else {
    opts.pre?.call(null, current, nextSibling)
    selectStepNodeTo(tree, stepSiblingFn, target, opts)
    opts.post?.call(null, current, nextSibling)
  }
}

const selectMultiNodeTo = (tree, start, target) => {
  if (!start || !target) return

  switch (start.compareDocumentPosition(target)) {
    case Node.DOCUMENT_POSITION_FOLLOWING:
      tree._walker.currentNode = start

      selectStepNodeTo(tree, () => tree._walker.nextSibling(), target, {
        pre: (current, nextSibling) => {
          selectMultiNode(current, nextSibling, { focus: false })
        }
      })

      tree._walker.currentNode = target
      setSelect(target)
      target.focus()
      break

    case Node.DOCUMENT_POSITION_PRECEDING:
      tree._walker.currentNode = start

      /* Fix Firefox lagging bug. (I don't know why, but this fix works like magic) */
      setSelect(target.parentNode.closest(`[${ARIA_SELECTED}]`))

      selectStepNodeTo(tree, () => tree._walker.previousSibling(), target, {
        pre: (current, nextSibling) => {
          selectMultiNode(current, nextSibling, { focus: false })
        }
      })

      /* Fix Firefox lagging bug. (I don't know why, but this fix works like magic) */
      setDeselect(target.parentNode.closest(`[${ARIA_SELECTED}]`))

      tree._walker.currentNode = target
      setSelect(target)
      target.focus()
      break
  }
}

const setSelect = (node) => {
  if (!node) return
  node.setAttribute(ARIA_SELECTED, true)
  node.tabIndex = 0
}
const setDeselect = (node) => {
  if (!node) return
  node.setAttribute(ARIA_SELECTED, false)
  node.tabIndex = -1
}
const setToggle = (node) =>
  node?.getAttribute(ARIA_SELECTED) == "true" ? setDeselect(node) : setSelect(node)

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

const reselectNodes = (tree, childIncidesPerParent, opts = {}) => {
  deselectAllNode(tree)

  for (let parent of filterMostOuters(Object.keys(childIncidesPerParent))) {
    let indices = childIncidesPerParent[parent]

    if (parent == "") parent = tree.querySelector(`[id][aria-level]`)
    else parent = tree.querySelector(`[id='${CSS.escape(parent)}'][aria-level]`)

    if (!parent) continue
    let dstLevel = parseInt(parent.getAttribute("aria-level"))
    let children = parent.querySelectorAll(`[aria-level='${dstLevel + 1}'][role='treeitem']`)

    for (let i = 0; i < indices.length; i++) {
      let index = indices[i].index
      let a = children[index]
      if (!a) return

      a.classList.add("item-pasted")
      if (opts.direction)
        a.classList.add(opts.direction)

      selectMultiNode(null, a, { focus: i == (indices.length - 1) })
      tree._walker.currentNode = a
    }
  }
}

const selectedGroupedByParent = (tree, opts = {}) => {
  let selected = tree.querySelectorAll(`${opts.ops || `[${ARIA_SELECTED}='true']`}`)
  let acc = {}

  for (let i = 0; i < selected.length; i++) {
    let child = selected[i]
    let parent = child.parentNode.closest("[role='treeitem']")
    if (!parent) break

    child.index = child.index || parseInt(child.getAttribute("aria-posinset")) - 1
    acc[parent.id] = acc[parent.id] || []
    acc[parent.id].push(child)
  }
  return acc
}

const expandSelected = (tree) => {
  let groups = tree.querySelectorAll(`[${ARIA_SELECTED}='true']`)

  for (let i = 0; i < groups.length; i++)
    groups[i].setAttribute(ARIA_EXPANDED, "true")
}

const collapseSelected = (tree) => {
  let groups = tree.querySelectorAll(`[${ARIA_SELECTED}='true']`)

  for (let i = 0; i < groups.length; i++)
    groups[i].setAttribute(ARIA_EXPANDED, "false")
}

const clearClipboard = (tree) => {
  tree.querySelectorAll(".item-cutting, .item-copying").forEach(a => a.classList.remove("item-cutting", "item-copying"))
  window._treeClipboard = null
}
