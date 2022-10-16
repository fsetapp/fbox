import { html } from "lit-html"
import { isContainer } from "../sch.js"
import * as Html from "../pkgs/html.js"
import { autoResize, cursorEnd, b } from "../utils.js"
import { roleTree, treeItem, viewItself, keyedOrIndexed } from "./_iterator_view.js"

export const renderRoot = (el, root, opts = {}) => roleTree(el, root, viewTreeitem, opts)

const viewTreeitem = (assigns) => {
  const { sch, ui } = assigns

  switch (true) {
    case ui.level == ui.rootLevel:
      assigns.item = { nodeclass: `root-item ${tstr(sch, ui)}` }
      return treeItem(assigns, viewRootItem)

    case ui.level == ui.rootLevel + 1:
      assigns.item = { nodeclass: `node ${tstr(sch, ui)}`, expanded: true }
      return treeItem(assigns, viewTop)

    case isContainer(sch):
      assigns.item = { nodeclass: `node ${tstr(sch, ui)}` }
      if (tstr(sch, ui) == "attr") assigns.item.expanded = b(assigns.sch.expanded, true)
      return treeItem(assigns, viewNode)

    default:
      assigns.item = { nodeclass: `leaf ${tstr(sch, ui)}` }
      return treeItem(assigns, viewLeaf)
  }
}

const viewRootItem = (assigns) =>
  html`
  <span class="h">${assigns.key}</span>
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
    ${viewItself(assigns, viewTreeitem)}
  </ol>`

const viewTop = (assigns) =>
  html`
  <span class="h">
    ${editableKey(assigns)}
    <span class="t">${tagText(assigns.sch, assigns.ui)}</span>
  </span>
  ${viewItself(assigns, viewTreeitem)}
  `

const viewNode = (assigns) =>
  html`
  ${editableTag(assigns)}
  ${viewItself(assigns, viewTreeitem)}
  `
const viewLeaf = (assigns) =>
  editableVal(assigns)

const indent = (assigns, extra = 0) => `padding-left: ${((assigns.ui.level - 1) * 2) + assigns.ui.tab - 1 + extra}ch`

const textInput = (id, parentId, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-id="${parentId}"
  data-newline="false"
  @input="${autoResize}"
  @focus="${cursorEnd}"
  .value=${content}></textarea>`

const longTextInput = (id, parentId, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" rows="1" autofocus
  data-parent-id="${parentId}"
  data-newline="false"
  @input="${autoResize}"
  @focus="${cursorEnd}"
  .value=${content}
  ></textarea>`

const editableKey = (assigns) =>
  assigns.sch.uiMode == "editKey" ?
    html`<span class="k">${textInput("key-edit", assigns.ui.parentId, assigns.key)}</span>` :
    html`<span class="top-name">${assigns.key}</span>`

const editableVal = (assigns) =>
  assigns.sch.uiMode == "editVal" ?
    html`<span class="v"><span>${longTextInput("val-edit", assigns.ui.parentId, assigns.sch.v)}</span></span>` :
    html`<span class="v">${assigns.sch.v || "_"}</span>`

const editableTag = ({ sch, ui }) => {
  switch (true) {
    case sch.t == Html.ATTR:
      return html`<span class="k">•</span>`

    case sch.uiMode == "editKey":
      return html`<span class="k"><combo-box id="type_search" list="typesearch">${textInput("key-edit", ui.parentId, sch.key)}</combo-box></span>`

    default:
      return html`<span class="k">${sch.key}</span>`
  }
}

const tstr = (sch, ui) => ui.structSheet[sch.m].toStr[sch.t]
const tagText = (sch, ui) => {
  if (sch.t == Html.TAG || sch.t == Html.HTML) return ui.structSheet[sch.m].toStr[sch.t]
  else return ""
}
