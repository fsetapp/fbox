import * as AriaTree from "../aria_tree.js"
import { currentParent } from "../actions.js"
import { writable, readable } from "../utils.js"
import { define } from "../elements/define.js"

export const TreeComponent = (params) => {
  let { store, target, view } = params
  const { domEvents, opts = {} } = params

  writable(store, "render", function (s, opts) { view(s || this, opts) })
  writable(store, "currentNode")
  writable(store, "_tree")
  store.render()

  target = document.querySelector(target)
  let tree = target?.querySelector(`[role='tree']`)

  if (tree) {
    tree._passthrough = opts.passthrough
    tree._aria = AriaTree
    tree._render = view
    store._tree = tree
    tree._walker = AriaTree.createWalker(tree)

    define(target.tagName.toLowerCase(), { store, tree }, domEvents, { denyFn: shouldReturn, postFn: dispatchCmd })

    opts.rendered?.(tree)
    AriaTree.selectNode(tree, tree._walker.currentNode, { focus: opts.focus })
    if (opts.focus) tree._walker.currentNode.scrollIntoView({ block: "center" })
    return target
  }
}

const shouldReturn = ({ tree, store }, command) => {
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


const dispatchCmd = ({ tree }, cmd) =>
  tree.dispatchEvent(new CustomEvent("tree-command", {
    bubbles: true, detail: { tree, target: tree._walker.currentNode, command: cmd }
  }))
