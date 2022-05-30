import { html, nothing } from "lit-html"

import * as M from "../pkgs/model.js"
import * as S from "../pkgs/sheet.js"
import { autoResize, cursorEnd } from "../utils.js"
import * as TypeView from "./model/_type_view.js"
import modelKSTView from "./model/_kst_view.js"
import { roleTree, treeItem, viewItself, groupSize, keyedOrIndexed } from "./_iterator_view.js"
import { diffdata } from "./_diff_view.js"

const { assign } = Object
export const renderRoot = (el, root, opts = {}) => roleTree(el, root, viewMux, opts)

const isTopLV = ({ ui }) => ui.level == ui.rootLevel + 1
const indent = ({ ui }, extra = 0) => `padding-left: ${((ui.level - 1) * 2) + ui.tab - 1 + extra}ch`
const is = ({ m, t }, sch) => m == sch.m && t == sch.t

const viewMux = assigns => {
  const { parent, sch, ui } = assigns

  if (is(parent, S.data()) && parent.schs[0].$r)
    assigns.ui.form = true

  switch (true) {
    case ui.level == ui.rootLevel:
      assigns.item = { nodeclass: "root-item", expanded: true }
      return treeItem(assigns, viewRootItem)

    case is(sch, M.list()):
      if (!!sch.sch.fields || !!sch.sch.schs)
        assigns.item = { nodeclass: "node", expanded: true }
      else
        assigns.item = { nodeclass: "node", expanded: false }

      return treeItem(assigns, viewNode)

    case is(parent, S.data()) && !parent.schs[0].$r:
      assigns.item = { nodeclass: "inline-node", expanded: true }
      if (parent.schs[0].$a == sch.$a) return nothing
      return treeItem(assigns, viewNode)

    case !!sch.fields || !!sch.schs || !!sch.sch:
      assigns.item = { nodeclass: "node", expanded: true }
      return treeItem(assigns, viewNode)

    default:
      assigns.item = { nodeclass: "leaf" }
      return treeItem(assigns, viewLeaf)
  }
}

const viewRootItem = assigns =>
  html`
  <span class="h">${assigns.key}</span>
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
    ${viewItself(assigns, viewMux)}
  </ol>
  <div>
    <button data-cmd="add-data" .putSch="${S.data}">add form</button>
  </div>
  `

const viewNode = assigns =>
  html`
  <div class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKST(assigns)}
  </div>
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group">
    ${viewItself(assigns, viewMux)}
  </ol>`

const viewLeaf = assigns => viewKST(assigns)

const viewKST = assigns => {
  const { sch, parent, ui } = assigns

  switch (true) {
    case is(parent, S.data()) && !parent.schs[0].$r:
      return editableT(assigns, "call-ctor")

    case is(parent, S.data()):
      return html`
        <span class="s" style="${indent(assigns)}">${TypeView.typeText(parent, ui)}</span>
        ${editableT(assigns, "call-ctor")}
      `
  }

  return modelKSTView(assigns)
}

const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-path="${parentPath}"
  data-newline="false"
  @input="${autoResize}"
  @focus="${cursorEnd}"
  .value=${content}></textarea>`

const editableT = (assigns, inputId) =>
  assigns.sch.uiMode == "editType" ?
    html`<combo-box class="t" id="type_search" list="typesearch">${textInput(inputId, assigns.ui.parentPath, typeTextPopulated(assigns.sch, assigns.ui))}</combo-box>` :
    html`<span class="t">${typeText(assigns)}</span>`

const typeTextPopulated = (sch, ui) => {
  switch (true) {
    case is(sch, S.data()):
      return "data"
    default:
      return TypeView.typeTextPopulated(sch, ui)
  }
}
const typeText = (assigns) => {
  const { sch, ui, parent } = assigns

  switch (true) {
    case is(sch, S.data()):
      return "data"
    case is(parent, S.data()) && !parent.schs[0].$r:
      return "_"
    case is(parent, S.data()):
      return ""

    default:
      return TypeView.typeText(sch, ui)
  }
}
