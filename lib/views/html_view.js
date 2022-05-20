import { html } from "lit-html"
import * as Html from "../pkgs/html.js"
import { autoResize, autoWidth, cursorEnd } from "../utils.js"
import { roleTree, treeItem, viewItself, keyedOrIndexed } from "./_iterator_view.js"

export const renderRoot = (el, root, opts = {}) => roleTree(el, root, viewTreeitem, opts)

const viewTreeitem = (assigns) => {
  const { sch, ui } = assigns
  switch (true) {
    case ui.level == ui.rootLevel:
      assigns.item = { nodeclass: `root-item ${tagText(sch, ui)}`, expanded: true }
      return treeItem(assigns, viewRootItem)

    case ui.level == ui.rootLevel + 1:
      assigns.item = { nodeclass: `node ${tagText(sch, ui)}`, expanded: true }
      return treeItem(assigns, viewTop)

    case assigns.sch.hasOwnProperty("fields") || assigns.sch.hasOwnProperty("schs"):
      assigns.item = { nodeclass: `node ${tagText(sch, ui)}`, expanded: true }
      return treeItem(assigns, viewNode)

    default:
      assigns.item = { nodeclass: `leaf ${tagText(sch, ui)}` }
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
  ${editableKey(assigns)}
  ${editableTag(assigns)}
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group">
    ${viewItself(assigns, viewTreeitem)}
  </ol>`

const viewNode = (assigns) =>
  html`
  ${editableTag(assigns)}
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group">
    ${viewItself(assigns, viewTreeitem)}
  </ol>`

const viewLeaf = (assigns) =>
  html`
  ${editableTag(assigns)}
  ${editableText(assigns)}`

const indent = (assigns, extra = 0) => `padding-left: ${((assigns.ui.level - 1) * 2) + assigns.ui.tab - 1 + extra}ch`
const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-path="${parentPath}"
  data-newline="false"
  @input="${autoWidth}"
  @focus="${cursorEnd}"
  .value=${content}
  ></textarea>`

const longTextInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" rows="1" autofocus
  data-parent-path="${parentPath}"
  data-newline="false"
  @input="${autoResize}"
  @focus="${cursorEnd}"
  .value=${content}
  ></textarea>`

const editableKey = (assigns) =>
  (assigns.sch.uiMode == "editKey") ?
    textInput("key-edit", assigns.ui.parentPath, assigns.key) :
    html`${assigns.key}`

const editableVal = (assigns) =>
  (assigns.sch.uiMode == "editVal") ?
    longTextInput("val-edit", assigns.ui.parentPath, assigns.key) :
    html`${assigns.sch.v}`

const editableText = (assigns) => {
  switch (true) {
    case assigns.sch.uiMode == "editVal":
      return html`<combo-box class="v">
        ${textInput("val-edit", assigns.ui.parentPath, assigns.sch.v)}
      </combo-box>`

    default:
      return html`<span class="v">${editableVal(assigns)}</span>`
  }
}
const editableTag = (assigns) => {
  switch (true) {
    case assigns.sch.uiMode == "editType":
      return html`<combo-box class="t" id="type_search" list="typesearch">
        ${textInput("type-edit", assigns.ui.parentPath, tagTextPopulated(assigns.sch, assigns.ui))}
      </combo-box>`

    case assigns.sch.t == Html.TEXT:
      return html`<span class="t text">•</span>`

    default:
      return html`<span class="t">${tagText(assigns.sch, assigns.ui)}</span>`
  }
}

const tagTextPopulated = (sch, ui) => tagText(sch, ui)
const tagText = (sch, ui) => ui.structSheet[sch.m].toStr[sch.t]
