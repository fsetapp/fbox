import { html } from "lit-html"

import * as M from "../pkgs/model.js"
import { autoResize, cursorEnd } from "../utils.js"
import * as TypeView from "./_type_view.js"
import { roleTree, treeItem, viewItself, groupSize, keyedOrIndexed } from "./_iterator_view.js"
import { diffdata, tagdata } from "./_diff_view.js"

const { assign } = Object
export const renderRoot = (el, root, opts = {}) => roleTree(el, root, viewModel, opts)

const viewModel = (assigns) => {
  const { sch, ui } = assigns
  assigns.item = {}

  switch (true) {
    case ui.level == ui.rootLevel:
      assigns.item = { nodeclass: "root-item", expanded: true }
      return treeItem(assigns, viewRootItem)

    case [M.LIST].includes(sch.t):
      if (!!sch.sch.fields || !!sch.sch.schs)
        assigns.item = { expanded: true }
      else
        assigns.item = { expanded: false }

      return treeItem(assigns, viewNode)

    case !!sch.fields || !!sch.schs:
      assigns.item = { expanded: true }
      return treeItem(assigns, viewNode)

    default:
      return treeItem(assigns, viewLeaf)
  }
}

const viewRootItem = (assigns) =>
  html`
  <dfn class="h" id="${tagdata(assigns.sch.tag)}_tree">
    ${assigns.key}
  </dfn>
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
    ${viewItself(assigns, viewModel)}
  </ol>
  <div>
    <button data-cmd="add-section" .putSch="${1}">add section</button>
    <button data-cmd="add-form" .putSch="${1}">add form</button>
  </div>
  `

const viewNode = (assigns) =>
  html`
  <dfn class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKey(assigns)}
    ${viewType(assigns)}
  </dfn>
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group">
    ${viewItself(assigns, viewModel)}
  </ol>`

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
  .value=${content}></textarea>`


const viewKey = (assigns) =>
  assigns.ui.level == assigns.ui.rootLevel + 1 ? viewKeyTop(assigns) : viewKeyNonTop(assigns)

const viewKeyTop = (assigns) =>
  html`
  <span class="k">${editableKey(assigns)}</span>
  <span class="s">=</span>
  `

const viewKeyNonTop = (assigns) => {
  switch (true) {
    case assigns.parent.t == M.UNION:
      return html`
      <span class="s" style="${indent(assigns)}">|</span>
      `
    case assigns.parent.t == M.DICT && assigns.sch.$a == assigns.parent.schs[0].$a:
      return html`
      <span class="s" style="${indent(assigns)}">k</span>
      `
    case assigns.parent.t == M.DICT && assigns.sch.$a == assigns.parent.schs[1].$a:
      return html`
      <span class="s" style="${indent(assigns)}">v</span>
      `
    case assigns.parent.t == M.E_RECORD && assigns.sch.$a == assigns.parent.schs[0].$a:
      return html`
      <span class="s" style="${indent(assigns)}">e</span>
      `
    case assigns.parent.t == M.E_RECORD && assigns.sch.$a == assigns.parent.schs[1].$a:
      return html`
      <span class="s" style="${indent(assigns)}">r</span>
      `
    case assigns.parent.t == M.LIST:
      return html`
      <span class="s" style="${indent(assigns)}">└</span>
      `
    case assigns.parent.t == M.RECORD && assigns.sch.t == M.UNION:
      return html`
      <span class="k" style="${indent(assigns)}" data-required="${!!assigns.sch.metadata?.required}"
        data-is-pattern="${!!assigns.sch.metadata?.isKeyPattern}">
        ${editableKey(assigns)}
      </span>
      <span class="s"></span>
    `
    case assigns.parent.t == M.RECORD:
      return html`
      <span class="k" style="${indent(assigns)}" data-required="${!!assigns.sch.metadata?.required}"
        data-is-pattern="${!!assigns.sch.metadata?.isKeyPattern}">
        ${editableKey(assigns)}
      </span>
      <span class="s">:</span>
    `
    case assigns.parent.t == M.TAGGED_UNION:
      return html`
      <span class="s" style="${indent(assigns)}">|</span>
      <span class="k tag">
        ${editableKey(assigns)}
      </span>
      <span class="s">·</span>
    `
    default:
      return html`
      <span class="k" style="${indent(assigns)}">
        ${editableKey(assigns)}
      </span>
      <span class="s">:</span>
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
  else return html`<span class="t">${editableType(assigns)}</span>`
}
const viewTypeNonTop = (assigns) =>
  html`<span class="t">${editableType(assigns)}</span>`
const editableType = (assigns) =>
  (assigns.sch.uiMode == "editType") ?
    html`<combo-box id="type_search" list="typesearch">
  ${textInput("type-edit", assigns.ui.parentPath, typeTextPopulated(assigns.sch, assigns.ui))}
</combo-box>` :
    html`${typeText(assigns.sch, assigns.ui)}`

const typeTextPopulated = (sch, ui) => TypeView.typeTextPopulated(sch, ui)
const typeText = (sch, ui) => TypeView.typeText(sch, ui)