import { buffer, forEach } from "./utils.js"

export {
  createWalker, walk, walkSelectable, deselectAllNode,
  selectNode, selectMultiNode, selectMultiNodeTo, toggleSelectNode, reselectNodes, selectedGroupedByParent, findUnselectedNode,
  clearClipboard, expandSelected, collapseSelected, toggleExpandCollapse, ensureNodeConnected, onlyMostOuters
}

const ARIA_SELECTED = "aria-selected"
const ARIA_EXPANDED = "aria-expanded"

const walk = (tree, f) => {
  tree._tempWalker = createWalker(tree)
  let n
  while (n = tree._tempWalker.nextNode()) f(n)
  delete tree._tempWalker
}
const walkSelectable = (tree, f) => {
  for (let item of tree.querySelectorAll(`[${ARIA_SELECTED}]`))
    f({
      n: item,
      selected: item.getAttribute(ARIA_SELECTED) == "true",
      expanded: item.getAttribute(ARIA_EXPANDED) == "true"
    })
}

const createWalker = tree =>
  tree.ownerDocument.createTreeWalker(
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
    })

const selectNode = (tree, node, opts = { focus: true }) => {
  node = ensureNodeConnected(tree, node)
  if (!node) return
  tree._walker.currentNode = node

  deselectAllNode(tree)
  setSelect(node)
  opts.focus && focus(node)
}

const toggleSelectNode = (current, node) => {
  if (current) current.tabIndex = -1
  setToggle(node)
}

const selectMultiNode = (current, nextStepSibling, opts = { focus: true }) => {
  if (!nextStepSibling) return

  // if (current) current.tabIndex = -1
  if (nextStepSibling.getAttribute(ARIA_SELECTED) == "true")
    setToggle(current)
  else
    setSelect(nextStepSibling)

  opts.focus && focus(nextStepSibling)
}

const deselectAllNode = (tree, opts = {}) => {
  for (let item of tree.querySelectorAll(`[${ARIA_SELECTED}='true']`))
    setDeselect(item)
  for (let item of tree.querySelectorAll(`[tabindex='0']`))
    item.tabIndex = -1
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

// Note: This perf is slower than non-(tree._walker.nextSibling()) version (see: reselectNodes)
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
      focus(target)
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
      focus(target)
      break
  }
}

const focus = node => { node.focus(); node.tabIndex = 0 }
const setSelect = node => node?.setAttribute(ARIA_SELECTED, true)
const setDeselect = node => node?.setAttribute(ARIA_SELECTED, false)
const setToggle = node =>
  node?.getAttribute(ARIA_SELECTED) == "true" ? setDeselect(node) : setSelect(node)

const findUnselectedNode = (fstep, nextNode) => {
  do nextNode = fstep()
  while (nextNode?.getAttribute(ARIA_SELECTED) == "true")
  return nextNode
}

const onlyMostOuters = paths => {
  const notAnyDescendantOf = p => paths.reduce((acc, p_) => {
    let acc_
    if (p_ == "" || p == p_) acc_ = true
    else acc_ = !p.startsWith(p_)
    return acc && acc_
  }, true)

  const paths_ = paths
    .filter(p => notAnyDescendantOf(p))
    .reduce((acc, a) => Object.assign(acc, { [a]: null }), {})

  return Object.keys(paths_)
}

const reselectNodes = (tree, childIncidesPerParent, opts = {}) => {
  deselectAllNode(tree, opts)

  for (let parent of onlyMostOuters(Object.keys(childIncidesPerParent))) {
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

      if (opts.direction)
        a.classList.add(opts.direction)

      selectMultiNode(children[index - 1], a, { focus: false && i == (indices.length - 1) })
      tree._walker.currentNode = a
    }
    // Last focus causes slowness when large clone.
    // Firefox: ~300ms (line 1) vs ~30ms (line 2)
    // Chrome: 1300ms vs 1500ms
    opts = Object.assign({ sync: true }, opts)
    opts.sync ?
      focus(tree._walker.currentNode) :
      buffer(() => focus(tree._walker.currentNode))()
  }
}

const selectedGroupedByParent = (tree, opts = {}) => {
  let selected = tree.querySelectorAll(`${opts.ops || `[${ARIA_SELECTED}='true']`}`)
  let acc = {}

  for (let i = 0; i < selected.length; i++) {
    let child = selected[i]
    let parent = child.parentNode.closest("[role='treeitem']")
    if (!parent) break
    const parentId = parent.sch?.$a || parent.id

    child.index = child.index || parseInt(child.getAttribute("aria-posinset")) - 1
    acc[parentId] = acc[parentId] || []
    acc[parentId].push(child)
  }
  return acc
}

const expandSelected = (tree) => {
  let groups = tree.querySelectorAll(`[${ARIA_SELECTED}='true']`)

  for (let i = 0; i < groups.length; i++)
    if (groups[i].hasAttribute(ARIA_EXPANDED))
      groups[i].setAttribute(ARIA_EXPANDED, "true")
}

const collapseSelected = (tree) => {
  let groups = tree.querySelectorAll(`[${ARIA_SELECTED}='true']`)

  for (let i = 0; i < groups.length; i++)
    if (groups[i].hasAttribute(ARIA_EXPANDED))
      groups[i].setAttribute(ARIA_EXPANDED, "false")
}

const toggleExpandCollapse = (tree) => {
  let groups = tree.querySelectorAll(`[${ARIA_SELECTED}='true']`)

  for (let i = 0; i < groups.length; i++)
    if (groups[i].getAttribute(ARIA_EXPANDED) == "true")
      groups[i].setAttribute(ARIA_EXPANDED, "false")
    else if (groups[i].getAttribute(ARIA_EXPANDED) == "false")
      groups[i].setAttribute(ARIA_EXPANDED, "true")
}

const clearClipboard = (tree) => {
  forEach(tree.querySelectorAll(".item-cutting, .item-copying, [data-err]"), a => {
    a.classList.remove("item-cutting", "item-copying")
    a.removeAttribute("data-err")
  })

  window._treeClipboard = null
}

const ensureNodeConnected = (tree, node) => {
  if (node && !node.isConnected)
    return node.id ?
      tree.querySelector(`[id='${CSS.escape(node.id)}']`) :
      tree.querySelector(`[id]`)
  else
    return node
}
