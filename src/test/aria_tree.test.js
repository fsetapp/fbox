import { assert } from "@esm-bundle/chai";
import {
  createWalker,
  selectNode, selectMultiNode, selectStepNodeTo, reselectNodes, selectedGroupedByParent, findUnselectedNode,
  clearClipboard
} from "../aria_tree.js"

describe("aria [role='tree']", () => {
  var tree

  beforeEach(() => {
    document.body.innerHTML = `
      <ul id="tree" role="tree">
        <li id="root" aria-selected="false" aria-level="1" role="treeitem">
          <ul role="group id="fmodels">
            <li></li>
            <li id="first" aria-selected="false" role="treeitem" aria-level="2"></li>
            <li id="second" aria-selected="false" role="treeitem" aria-level="2"></li>
            <li id="root/last" aria-selected="false" role="treeitem" aria-level="2">
              <ul role="group">
                <li aria-selected="false" role="treeitem" aria-level="3"></li>
                <li id="nested-last" aria-selected="false" role="treeitem" aria-level="3"></li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    `
    tree = document.querySelector("[role='tree']")
    createWalker(tree)
    tree._walker.nextNode()
  })

  it("#createWalker", () => {
    let firstNode = tree._walker.nextNode()

    assert.isOk(tree._walker instanceof TreeWalker)
    assert.equal(firstNode.id, "first")
    assert.equal(firstNode.getAttribute("aria-selected"), "false")
  })

  it("#selectNode no next node", () => {
    let lastNode = tree._walker.lastChild()
    selectNode(tree, tree._walker.currentNode, lastNode)
    selectNode(tree, tree._walker.currentNode, tree._walker.nextSibling())

    assert.equal(document.activeElement, lastNode)
  })

  it("#selectMultiNode", () => {
    selectMultiNode(tree._walker.currentNode, tree._walker.nextNode())
    selectMultiNode(tree._walker.currentNode, tree._walker.nextNode())

    assert.equal(document.activeElement, tree._walker.currentNode)
    assert.equal(document.querySelectorAll("[aria-selected='true']").length, 2)
  })

  it("#selectMultiNode unselect selected node", () => {
    selectMultiNode(tree._walker.currentNode, tree._walker.nextNode())
    selectMultiNode(tree._walker.currentNode, tree._walker.nextNode())
    selectMultiNode(tree._walker.currentNode, tree._walker.previousNode())

    assert.equal(document.activeElement, tree._walker.currentNode)
    assert.equal(document.querySelectorAll("[aria-selected='true']").length, 1)
  })

  it("#selectStepNodeTo", () => {
    selectNode(tree, tree._walker.currentNode, tree._walker.nextNode())

    let startNode = tree._walker.currentNode
    selectStepNodeTo(tree, () => tree._walker.nextSibling())

    assert.equal(document.activeElement, startNode)
    assert.equal(document.querySelectorAll("[aria-selected='true']").length, 3)
  })

  it("#findUnselectedNode next sibling", () => {
    tree._walker.currentNode = document.querySelector("[id='second']")
    let nextToSecond = findUnselectedNode(() => tree._walker.nextSibling())
    assert.equal(nextToSecond.id, "root/last")
  })

  it("#findUnselectedNode previous sibling", () => {
    tree._walker.currentNode = document.querySelector("[id='second']")
    let nextToSecond = findUnselectedNode(() => tree._walker.previousSibling())
    assert.equal(nextToSecond.id, "first")
  })

  it("#findUnselectedNode parent", () => {
    tree._walker.currentNode = document.querySelector("[id='nested-last']")
    let nextToNestedLast = findUnselectedNode(() => tree._walker.parentNode())
    assert.equal(nextToNestedLast.id, "root/last")
  })

  it("#reselectNodes most outer of multiple parents", () => {
    reselectNodes(tree, { "root": [{ index: 0 }, { index: 1 }], "root/last": [{ index: 0 }] })
    assert.equal(document.querySelectorAll("[aria-selected='true']").length, 2)
  })

  it("#selectedGroupedByParent", () => {
    reselectNodes(tree, { "root": [{ index: 0 }, { index: 1 }], "root/last": [{ index: 1 }], "not-exist": [] })
    let selectedPerParent = selectedGroupedByParent(tree)
    assert.deepEqual(selectedPerParent["root"].map(a => [a.index, a.id]), [[0, "first"], [1, "second"]])
  })

  it("#selectedGroupedByParent no parent", () => {
    document.body.innerHTML = `
    <ul id="tree" role="tree">
      <li id="non-item-parent">
        <ul id="non-item-group">
          <span aria-selected="false" id="non-item"></span>
        </ul>
      </li>
    </ul>`
    tree = document.querySelector("[role='tree']")
    createWalker(tree)

    document.querySelector("[id='non-item']").setAttribute("aria-selected", true)
    let selectedPerParent = selectedGroupedByParent(tree)
    assert.deepEqual(selectedPerParent, {})
  })

  it("#clearClipboard ", () => {
    tree.querySelectorAll("[role='treeitem']").forEach(a => a.classList.add("item-cutting"))
    tree._clipboard = () => ""
    clearClipboard(tree)

    assert.isNotOk(tree._clipboard)
    tree.querySelectorAll("[role='treeitem']").forEach(a => assert.isNotOk(a.classList.contains("item-cutting")))
  })
})
