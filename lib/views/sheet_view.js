import { html } from "lit-html"
import { ifDefined } from "lit-html/directives/if-defined.js"

import * as Core from "../pkgs/core.js"
import * as M from "../pkgs/model.js"
import * as S from "../pkgs/sheet.js"
import { autoResize, cursorEnd } from "../utils.js"
import * as TypeView from "./_type_view.js"
import { roleTree, treeItem, viewItself, groupSize, keyedOrIndexed } from "./_iterator_view.js"
import { diffdata, tagdata } from "./_diff_view.js"

const { assign } = Object
export const renderRoot = (el, root, opts = {}) => roleTree(el, root, viewMux, opts)

const isTopLV = ({ ui }) => ui.level == ui.rootLevel + 1
const indent = ({ ui }, extra = 0) => `padding-left: ${((ui.level - 1) * 2) + ui.tab - 1 + extra}ch`
const is = ({ m, t }, sch) => m == sch.m && t == sch.t

const viewMux = assigns => {
  const { sch, ui } = assigns
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

    case is(sch, S.data()):
      assigns.item = { nodeclass: "inline-node", expanded: true }
      return treeItem(assigns, viewInlineNode)

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

const viewInlineNode = assigns =>
  html`
  <div class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKST(assigns)}
  </div>
  ${viewItself(assigns, viewMux)}`

const viewLeaf = assigns => viewKST(assigns)

const viewKST = assigns => {
  const { sch, parent } = assigns

  const keyRequired = ifDefined(sch.metadata?.required)
  const keyPattern = ifDefined(sch.metadata?.isKeyPattern)
  const kst = (assigns, { s }) =>
    html`
    <span class="k" style="${indent(assigns)}" data-required="${keyRequired}" data-is-pattern="${keyPattern}">${editableKey(assigns)}</span>
    <span class="s">${s}</span>
    ${editableType(assigns)}
    `
  const st = (assigns, { s }) =>
    html`
    <span class="s" style="${indent(assigns)}">${s}</span>
    ${editableType(assigns)}
    `

  switch (true) {
    case is(parent, M.union()):
      return st(assigns, { s: "|" })

    case is(parent, M.dict()) && sch.$a == parent.schs[0].$a:
      return st(assigns, { s: "k" })

    case is(parent, M.dict()) && sch.$a == parent.schs[1].$a:
      return st(assigns, { s: "v" })

    case is(parent, M.erecord()) && sch.$a == parent.schs[0].$a:
      return st(assigns, { s: "e" })

    case is(parent, M.erecord()) && sch.$a == parent.schs[1].$a:
      return st(assigns, { s: "r" })

    case is(parent, M.list()):
      return st(assigns, { s: "└" })

    case is(parent, M.record()) && is(sch, M.union()):
      return kst(assigns, { s: "" })

    case is(parent, M.record()):
      return kst(assigns, { s: ":" })

    case is(parent, M.taggedUnion()):
      return html`
        <span class="s" style="${indent(assigns)}">|</span>
        <span class="k tag">
          ${editableKey(assigns)}
        </span>
        <span class="s">·</span>
        ${editableType(assigns)}
      `

    case is(parent, S.data()):
      return editableCall(assigns)

    default:
      return kst(assigns, { s: ":" })
  }
}

const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-path="${parentPath}"
  data-newline="false"
  @input="${autoResize}"
  @focus="${cursorEnd}"
  .value=${content}></textarea>`

const editableKey = (assigns) =>
  (assigns.sch.uiMode == "editKey") ?
    textInput("key-edit", assigns.ui.parentPath, assigns.key) :
    assigns.key

const editableType = (assigns) =>
  editableT(assigns, "type-edit")

const editableCall = (assigns) =>
  editableT(assigns, "call-ctor")

const editableT = (assigns, inputId) =>
  assigns.sch.uiMode == "editType" ?
    html`<combo-box class="t" id="type_search" list="typesearch">${textInput(inputId, assigns.ui.parentPath, typeTextPopulated(assigns.sch, assigns.ui))}</combo-box>` :
    html`<span class="t">${typeText(assigns.sch, assigns.ui)}</span>`

const typeTextPopulated = (sch, ui) => {
  switch (true) {
    case is(sch, S.data()):
      return "call"
    default:
      // ui.structSheet[sch.m].toStr[sch.t]
      return TypeView.typeTextPopulated(sch, ui)
  }
}
const typeText = (sch, ui) => {
  switch (true) {
    case is(sch, S.data()):
      return "call"
    default:
      // ui.structSheet[sch.m].toStr[sch.t]
      return TypeView.typeText(sch, ui)
  }
}
