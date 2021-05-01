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
      let rootNode = tree._walker.nextNode()
      let initialSelect = (store.currentNode?.isConnected && store.currentNode) || tree._walker.nextNode() || rootNode
      AriaTree.selectNode(tree, initialSelect, { focus: opts.focus })
    }

    tree._walker.currentNode.scrollIntoView({ block: "center" })
    return tree
  }
}

const handleTreeKeydown = (store, cmds, opts) => function (e) { handleTreeKeydown_(e, this, store, cmds, opts) }
async function handleTreeKeydown_(e, tree, store, cmds = [], opts = {}) {
  e.stopPropagation()
  if (e.target instanceof HTMLTextAreaElement) return handleTextAreaKeyDown(e, tree, store, opts.textAreaKeyDownCmd)

  const cmdsMap = new Map(cmds)
  let command = cmdsMap.get(toCmdkey(e))
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

  if (!tree._walker.currentNode.isConnected)
    tree._walker.currentNode = tree.querySelector(`[id='${CSS.escape(tree._walker.currentNode.id)}']`)

  store.currentNode = tree._walker.currentNode
  dispatchCmd(tree, tree._walker.currentNode, command)
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
