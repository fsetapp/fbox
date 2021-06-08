import * as Sch from "../sch.js"
import * as AriaTree from "../aria_tree.js"
import { clickSelect } from "../actions.js"

const { defineProperties } = Object
export const TreeComponent = ({ store, target, view, treeKeyDownCmds, textAreaKeyDownCmd, opts = {} }) => {
  defineProperties(store, {
    render: { value: function (s) { view(s || this) }, configurable: true },
    currentNode: { writable: true, configurable: true },
    _tree: { writable: true, configurable: true }
  })
  store.render()

  let tree = document.querySelector(`${target} [role='tree']`)

  if (tree) {
    tree._aria = AriaTree
    tree._render = view
    store._tree = tree
    AriaTree.createWalker(tree)
    tree.onkeydown = handleTreeKeydown(store, treeKeyDownCmds, { textAreaKeyDownCmd })
    tree.onclick = handleTreeClick(store)

    let selectedNode = tree.querySelector(`[id='${CSS.escape(opts.selectId)}']`)
    if (selectedNode && opts.selectId != "") {
      tree._walker.currentNode = selectedNode
      AriaTree.selectNode(tree, tree._walker.currentNode, { focus: opts.focus })
    } else {
      store.currentNode = AriaTree.ensureNodeConnected(tree, store.currentNode)

      let rootNode = tree._walker.nextNode()
      let initialSelect = store.currentNode || tree._walker.nextNode() || rootNode
      AriaTree.selectNode(tree, initialSelect, { focus: opts.focus })
    }

    tree._walker.currentNode.scrollIntoView({ block: "start" })
    return tree
  }
}

const handleTreeKeydown = (store, cmds, opts) => function (e) { handleTreeKeydown_(e, this, store, cmds, opts) }
async function handleTreeKeydown_(e, tree, store, cmds = [], opts = {}) {
  e.stopPropagation()
  switch (e.code) {
    case "ArrowUp": e.preventDefault(); break
    case "ArrowDown": e.preventDefault(); break
  }
  if (e.target instanceof HTMLTextAreaElement) return handleTextAreaKeyDown(e, tree, store, opts.textAreaKeyDownCmd)

  const cmdsMap = new Map(cmds)
  let command = cmdsMap.get(toCmdkey(e))
  if (!command) return
  if ((opts.denyCmds || []).includes(command.name)) return
  if (shouldReturn(tree, store, command)) return

  command({ tree, store })

  tree._walker.currentNode = AriaTree.ensureNodeConnected(tree, tree._walker.currentNode)
  AriaTree.selectNode(tree._walker.currentNode)

  store.currentNode = tree._walker.currentNode
  dispatchCmd(tree, tree._walker.currentNode, command)
}

const shouldReturn = (tree, store, command) => {
  let parentItem = tree._walker.currentNode.parentNode.closest("[role='treeitem']")
  if (!parentItem) return
  let parentSch = Sch.get(store, parentItem.id)

  let currentItem = tree._walker.currentNode
  let currentSch = Sch.get(store, currentItem.id)

  const match = (obj, selector) => {
    if (!obj) return false
    let acc = true
    for (let s of selector)
      acc = acc && obj[s[0]] == s[1]
    return acc
  }

  for (let row of store.rulesTable || []) {
    if (match(parentSch, row.selector)) {
      if (row.rules?.nthChild?.[currentSch._meta.index]?.exceptActions)
        if (row.rules.nthChild[currentSch._meta.index].exceptActions.map(a => a.name).includes(command.name)) return true
      if (row.rules.children?.onlyActions && !row.rules.children.onlyActions.map(a => a.name).includes(command.name)) return true
      if (row.rules.children?.exceptActions && row.rules.children.exceptActions.map(a => a.name).includes(command.name)) return true
    }
    if (match(currentSch, row.selector)) {
      if (row.rules.self?.onlyActions && !row.rules.self.onlyActions.map(a => a.name).includes(command.name)) return true
      if (row.rules.self?.exceptActions && row.rules.self.exceptActions.map(a => a.name).includes(command.name)) return true
    }
  }
  return false
}

const handleTextAreaKeyDown = (e, tree, store, cmds = []) => {
  e.stopPropagation()
  let textArea = e.target

  const cmdsMap = new Map(cmds)
  let command = cmdsMap.get(toCmdkey(e))
  if (!command) return
  command({ tree, store }, textArea)

  store.currentNode = tree._walker.currentNode
  dispatchCmd(tree, tree._walker.currentNode, command)
}

const handleTreeClick = (store) => function (e) { return handleTreeClick_(e, this, store) }
function handleTreeClick_(e, tree, store) {
  e.stopPropagation()
  let start = tree._walker.currentNode
  let target = e.target.closest("[role='treeitem']")
  let notFocusIfTextArea = !tree.querySelector("textarea")

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
  else {
    tree._walker.currentNode = target
    clickSelect({ tree }, { notFocusIfTextArea })

    store.currentNode = tree._walker.currentNode
    dispatchCmd(tree, target, clickSelect)
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

const dispatchCmd = (tree, target, cmd) =>
  tree.dispatchEvent(new CustomEvent("tree-command", { bubbles: true, detail: { target: target, command: cmd } }))
