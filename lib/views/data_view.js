import { html, nothing } from "lit-html"
import { ifDefined } from "lit-html/directives/if-defined.js"

import { is } from "../sch.js"
import * as S from "../pkgs/sheet.js"
import { autoResize, cursorEnd } from "../utils.js"

import { treeItem, viewItself, groupSize, keyedOrIndexed } from "./_iterator_view.js"
import { diffdata } from "./_diff_view.js"
import * as TypeView from "./model/_type_view.js"

export const byCase = assigns => {
  const { parent, sch } = assigns

  switch (true) {
    case is(sch, S.data()):
      if (sch.schs[0].$r) {
        assigns.ui.form = true
        assigns.item = { nodeclass: "node data", expanded: true }
      }
      else
        assigns.item = { nodeclass: "inline-node data", expanded: true }

      return treeItem(assigns, viewNode)

    case is(parent, S.data()):
      if (parent.schs[1].$a == sch.$a && parent.schs[0].$r)
        return treeItem(assigns, viewNodeHeadless)

      if (parent.schs[1].$a == sch.$a && !parent.schs[0].$r)
        return nothing

      assigns.item = { nodeclass: "data", expanded: true }
      return treeItem(assigns, viewForm)

    case !!sch.fields || !!sch.schs || !!sch.sch:
      assigns.item = { nodeclass: "node data", expanded: true }
      return treeItem(assigns, viewForm)

    default:
      assigns.item = { nodeclass: "leaf data" }
      return treeItem(assigns, viewLeaf)
  }
}

const viewNodeHeadless = assigns =>
  html`<ol data-group="${keyedOrIndexed(assigns.sch)}">${viewItself(assigns, byCase)}</ol>`

const viewNode = assigns =>
  html`
  <div class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKST(assigns)}
  </div>
  <ol data-group="${keyedOrIndexed(assigns.sch)}">
    ${viewItself(assigns, byCase)}
  </ol>`

const viewForm = assigns =>
  html`
  <div class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKST(assigns)}
  </div>
  <fieldset data-group="${keyedOrIndexed(assigns.sch)}">
    ${viewItself(assigns, byCase)}
  </fieldset>`

const viewLeaf = assigns => viewKST(assigns)

const indent = ({ ui }, extra = 0) => `padding-left: ${((ui.level - 1) * 2) + ui.tab - 1 + extra}ch`
const indentm = ({ ui }, extra = 0) => `margin-left: ${((ui.level - 1) * 2) + ui.tab - 1 + extra}ch`

export const viewKST = assigns => {
  const { sch, parent, ui } = assigns

  const keyRequired = ifDefined(sch.metadata?.required)
  const keyPattern = ifDefined(sch.metadata?.isKeyPattern)
  const kst = (assigns, { s }) =>
    html`
    <label class="k" for=${assigns.sch.$a} style="${indent(assigns)}" data-required="${keyRequired}" data-is-pattern="${keyPattern}">${assigns.key}</label>
    <span class="s">${s}</span>
    <input id="${assigns.sch.$a}" style="${indentm(assigns, 1)}" .value="${sch.v}">
    `
  const ks = (assigns, { s }) =>
    html`
    <label class="k" for=${assigns.sch.$a} style="${indent(assigns)}" data-required="${keyRequired}" data-is-pattern="${keyPattern}">${assigns.key}</label>
    <span class="s">${s}</span>
    `


  switch (true) {
    case is(parent, S.data()) && !parent.schs[0].$r:
      return editableT(assigns, "call-ctor")

    case is(parent, S.data()):
      return html`
        <span class="s"></span>
        ${editableT(assigns, "call-ctor")}
      `
    case !!sch.fields || !!sch.schs || !!sch.sch:
      return ks(assigns, { s: "" })

    default:
      return kst(assigns, { s: ":" })
  }
}

const editableKey = ({ sch, ui, key }) =>
  sch.uiMode == "editKey" ?
    textInput("key-edit", ui.parentPath, key) :
    key

const editableT = ({ sch, ui, parent }, inputId) =>
  sch.uiMode == "editType" ?
    html`<combo-box class="t" id="type_search" list="typesearch">${textInput(inputId, ui.parentPath, typeTextPopulated(sch, ui))}</combo-box>` :
    html`<span class="t">${typeText({ sch, ui, parent })}</span>`


const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-path="${parentPath}"
  data-newline="false"
  @input="${autoResize}"
  @focus="${cursorEnd}"
  .value=${content}></textarea>`

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
      return TypeView.typeText(sch, ui)

    default:
      return TypeView.typeText(sch, ui)
  }
}
