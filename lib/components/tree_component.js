import * as AriaTree from "../aria_tree.js"
import { currentParent } from "../actions.js"
import { writable } from "../utils.js"
import { define } from "../elements/define.js"

export const TreeComponent = (params) => {
  let { store, target, view } = params
  const { domEvents, opts = {} } = params

  writable(store, "currentNode", store.currentNode)
  writable(store, "_tree")
  view.render(store)

  target = document.querySelector(target)
  let tree = target?.querySelector(`[role='tree']`)

  if (tree) {
    tree._passthrough = opts.passthrough
    tree._aria = AriaTree
    tree._render = view.render
    store._tree = tree
    tree._walker = AriaTree.createWalker(tree)

    define(target.tagName.toLowerCase(), { store, tree, view }, domEvents, { denyFn: isActionDenied, postFn: dispatchCmd })

    opts.rendered?.(tree) || tree._walker.nextNode()
    if (store.currentNode) tree._walker.currentNode = store.currentNode
    if (tree._walker.currentNode != tree._walker.root)
      // setTimeout is unnecessary, we only use for testing mutiple instant focus (too fast to get the latter focused)
      setTimeout(() => AriaTree.selectNode(tree, tree._walker.currentNode, { focus: opts.focus }), 0)

    if (opts.focus) tree._walker.currentNode.scrollIntoView({ block: "center" })
    return target
  }
}

const isActionDenied = ({ tree, store }, command) => {
  let { parentSch, currentSch } = currentParent(tree, store)

  const actOnSelfIsBlocked = (schRule, commandName) => {
    const selfNoActs = schRule?.self?.off

    switch (true) {
      case Array.isArray(selfNoActs):
        if (selfNoActs.map(a => a.name).includes(commandName)) return true
      default:
        return false
    }
  }
  const actOnChildrenIsBlocked = (schRule, commandName) => {
    const nthNoActs = schRule?.nthChild?.[currentSch.index]?.off
    const childrenNoActs = schRule?.children?.off
    const childrenActs = schRule?.children?.on
    let denied = false

    if (nthNoActs)
      denied ||= nthNoActs.map(a => a.name).includes(commandName)

    if (childrenNoActs)
      denied ||= childrenNoActs.map(a => a.name).includes(commandName)

    if (childrenActs)
      denied ||= !childrenActs.map(a => a.name).includes(commandName)

    return denied
  }

  const cmd = command.name
  const currentRule = store.structSheet[currentSch.m].sheet[currentSch.t] || store.structSheet[currentSch.m].sheet.default
  const parentRule = store.structSheet[parentSch.m].sheet[parentSch.t] || store.structSheet[parentSch.m].sheet.default

  return actOnSelfIsBlocked(currentRule, cmd) || actOnChildrenIsBlocked(parentRule, cmd) || false
}


const dispatchCmd = ({ tree, store }, cmd) =>
  tree.dispatchEvent(new CustomEvent("tree-command", {
    bubbles: true, detail: { tree, store, target: tree._walker.currentNode, command: cmd }
  }))
