import { render, html, nothing } from "lit-html"

import { autoResize, cursorEnd } from "../utils.js"
import * as J from "../pkgs/json.js"
import { roleTree, treeItem, viewItself, keyedOrIndexed, groupSize } from "./_iterator_view.js"
import { diffdata, ifTagdata, tagdata } from "./_diff_view.js"

export const renderRoot = (el, root, opts = {}) => roleTree(el, root, viewBody, opts)

const viewBody = (assigns) => {
  switch (true) {
    case assigns.ui.level == assigns.ui.rootLevel:
      assigns.item = { nodeclass: "root-item" }
      return treeItem(assigns, viewRootNode)

    case !!assigns.sch.fields || !!assigns.sch.schs:
      if (assigns.ui.level < assigns.ui.rootLevel + 3)
        assigns.item = { nodeclass: "node", expanded: true }
      else
        assigns.item = { nodeclass: "node", expanded: false }

      return treeItem(assigns, viewNode)

    default:
      assigns.item = { nodeclass: "leaf" }
      return treeItem(assigns, viewLeaf)
  }
}

const viewRootNode = (assigns) =>
  html`
  <dfn class="h" id="${tagdata(assigns.sch.tag)}_tree">
    ${assigns.key}
  </dfn>
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
    ${viewItself(assigns, viewBody)}
  </ol>
  `

const viewNode = (assigns) =>
  html`
  <dfn class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKey(assigns)}
    ${viewType(assigns)}
  </dfn>
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group">
    ${viewItself(assigns, viewBody)}
  </ol>
  `

const viewLeaf = (assigns) =>
  html`
  ${viewKey(assigns)}
  ${viewType(assigns)}
  `

const indent = (assigns, extra = 0) => `padding-left: ${((assigns.ui.level - 1) * 2) + assigns.ui.tab - 1 + extra}ch`
const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-path="${parentPath}"
  data-newline="false"
  @input="${autoResize}"
  @focus="${cursorEnd}"
  .value=${content}
  ></textarea>`


const viewKey = (assigns) =>
  assigns.ui.level == assigns.ui.rootLevel + 1 ? viewKeyTop(assigns) : viewKeyNonTop(assigns)

const viewKeyTop = (assigns) =>
  html`
  <span class="k" >${editableKey(assigns)}</span>
  <span class="s">=</span>
  `

const viewKeyNonTop = (assigns) => {
  switch (true) {
    case assigns.parent.t == J.ARRAY && assigns.sch.t == J.OBJECT:
      return html`
      <span class="s">:</span>
      `
    case assigns.parent.t == J.ARRAY && assigns.sch.t == J.ARRAY:
      return html`
      <span class="s">[</span>
      `
    case assigns.parent.t == J.ARRAY:
      return nothing

    case assigns.parent.t == J.OBJECT:
      return html`
      <span class="k">${editableKey(assigns)}</span>
      <span class="s">${{ [J.OBJECT]: "", [J.ARRAY]: "[" }[assigns.sch.t] || ":"}</span>
      `
  }
}

const editableKey = (assigns) =>
  (assigns.sch.uiMode == "editKey") ?
    textInput("key-edit", assigns.ui.parentPath, assigns.key) :
    html`${assigns.key}`

const viewType = (assigns) =>
  assigns.ui.level == assigns.ui.rootLevel + 1 ? viewTypeTop(assigns) : viewTypeNonTop(assigns)
const viewTypeTop = (assigns) => {
  if (assigns.ui.viewTypeTop) return assigns.ui.viewTypeTop(assigns)
  else return editableType(assigns)
}
const viewTypeNonTop = (assigns) => editableType(assigns)
const editableType = (assigns) =>
  (assigns.sch.uiMode == "editType") ?
    html`<combo-box id="type_search" class="t" list="typesearch">
      ${textInput("type-edit", assigns.ui.parentPath, typeTextPopulated(assigns.sch, assigns.ui))}
    </combo-box>` :
    typeText(assigns.sch, assigns.ui)

const typeTextPopulated = (sch, ui) => sch.v || ui.structSheet[sch.m].toStr[sch.t]
const typeText = (sch, ui) => {
  switch (sch.t) {
    case J.OBJECT: return html`<span class="t obj"></span>`
    case J.ARRAY: return html`<span class="t arr"></span>`
    case J.STRING: return html`<span class="t str">"${sch.v}"</span>`
    case J.NUMBER: return html`<span class="t num">${sch.v}</span>`
    case J.BOOLEAN: return html`<span class="t bool">${sch.v}</span>`
    case J.NIL: return html`<span class="t nil">null</span>`
  }
}
