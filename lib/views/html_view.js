import { html } from "lit-html"
import * as Html from "../pkgs/html.js"
import { autoResize, autoWidth, cursorEnd } from "../utils.js"
import { roleTree, treeItem, viewItself, keyedOrIndexed } from "./_iterator_view.js"

export const renderRoot = (el, root, opts = {}) => roleTree(el, root, viewTreeitem, opts)

const viewTreeitem = (assigns) => {
  const { sch, ui } = assigns
  switch (true) {
    case ui.level == ui.rootLevel:
      assigns.item = { id: sch.$a, nodeclass: `root-item ${tstr(sch, ui)}`, expanded: true }
      return treeItem(assigns, viewRootItem)

    case ui.level == ui.rootLevel + 1:
      assigns.item = { id: sch.$a, nodeclass: `node ${tstr(sch, ui)}`, expanded: true }
      return treeItem(assigns, viewTop)

    case assigns.sch.hasOwnProperty("fields") || assigns.sch.hasOwnProperty("schs"):
      assigns.item = { id: sch.$a, nodeclass: `node ${tstr(sch, ui)}`, expanded: true }
      return treeItem(assigns, viewNode)

    default:
      assigns.item = { id: sch.$a, nodeclass: `leaf ${tstr(sch, ui)}` }
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
    <span class="k">${tagText(assigns.sch, assigns.ui)}</span>
  </span>
  ${viewItself(assigns, viewTreeitem)}
  `

const viewNode = (assigns) =>
  html`
  ${editableTag(assigns)}
  ${viewItself(assigns, viewTreeitem)}
  `
const viewLeaf = (assigns) =>
  html`
  ${editableTag(assigns)}
  ${editableText(assigns)}`

const indent = (assigns, extra = 0) => `padding-left: ${((assigns.ui.level - 1) * 2) + assigns.ui.tab - 1 + extra}ch`
const textInput = (id, parentId, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-id="${parentId}"
  data-newline="false"
  @input="${autoWidth(0)}"
  @focus="${cursorEnd}"
  .value=${content}
  ></textarea>`

const longTextInput = (id, parentId, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" rows="1" autofocus
  data-parent-id="${parentId}"
  data-newline="false"
  @input="${autoResize}"
  @focus="${cursorEnd}"
  .value=${content}
  ></textarea>`

const editableKey = (assigns) =>
  (assigns.sch.uiMode == "editKey") ?
    textInput("key-edit", assigns.ui.parentId, assigns.key) :
    html`<span class="top-name">${assigns.key}</span>`

const editableVal = (assigns) =>
  (assigns.sch.uiMode == "editVal") ?
    longTextInput("val-edit", assigns.ui.parentId, assigns.key) :
    html`${assigns.sch.v}`

const editableText = (assigns) => {
  switch (true) {
    case assigns.sch.uiMode == "editVal":
      return html`<combo-box class="v">
        ${textInput("val-edit", assigns.ui.parentId, assigns.sch.v)}
      </combo-box>`

    default:
      return html`<span class="v">${editableVal(assigns)}</span>`
  }
}
const editableTag = ({ sch, ui }) => {
  switch (true) {
    case sch.t == Html.ATTR:
      return html`<span class="k">•</span>`

    case sch.uiMode == "editKey":
      return html`<combo-box class="k" id="type_search" list="typesearch">
        ${textInput("key-edit", ui.parentId, sch.key)}
      </combo-box>`

    case sch.t == Html.TEXT:
      return html`<span class="k text">•</span>`

    default:
      return html`<span class="k">${sch.key}</span>`
  }
}

const tstr = (sch, ui) => ui.structSheet[sch.m].toStr[sch.t]
const tagText = (sch, ui) => {
  if (sch.t == Html.TAG || sch.t == Html.HTML) return ui.structSheet[sch.m].toStr[sch.t]
  else return ""
}
