import { html, nothing } from "lit-html"
import { ifDefined } from "lit-html/directives/if-defined.js"

import { is, isContainer } from "../sch.js"
import * as S from "../pkgs/sheet.js"
import { autoResize, cursorEnd } from "../utils.js"

import { treeItem, viewItself, groupSize, keyedOrIndexed } from "./_iterator_view.js"
import { diffdata } from "./_diff_view.js"
import * as TypeView from "./model/_type_view.js"

export const byCase = assigns => {
  const { parent, sch, ui } = assigns

  switch (true) {
    case is(sch, S.data()):
      assigns.item = { nodeclass: "inline-node data", expanded: true }
      return treeItem(assigns, viewNode)

    case is(parent, S.data()):
      if (parent.schs[0].$a == sch.$a) {
        assigns.item = { nodeclass: "data ctor-name" }
        return treeItem(assigns, viewLeaf)
      }
      if (parent.schs[1].$a == sch.$a) {
        assigns.item = { nodeclass: "data ctor-body", expanded: true }
        if (parent.schs[0].$r) return treeItem(assigns, viewDataBody)
        else return nothing
      }

    case isContainer(sch):
      // level 5 - leaf is final
      // level 5 - noode is a link to next page
      assigns.item = { nodeclass: "node data", expanded: true }
      return treeItem(assigns, viewDataBody)

    default:
      assigns.item = { nodeclass: "leaf data" }
      return treeItem(assigns, viewLeaf)
  }
}

const viewNode = assigns =>
  html`
  <div class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKST(assigns)}
  </div>
  ${viewItself(assigns, byCase)}`

const viewDataBody = assigns =>
  html`
  <div class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKST(assigns)}
  </div>
  <fieldset class="fbox" data-group="${keyedOrIndexed(assigns.sch)}">${viewItself(assigns, byCase)}</fieldset>`

const viewLeaf = assigns =>
  html`<div class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}" style="${assigns.ui.indent}">
    ${viewKST(assigns)}
  </div>`

const indent = ({ ui }, extra = 0) => `padding-left: ${((ui.level - 1) * 2) + ui.tab - 1 + extra}ch`
const indentm = ({ ui }, extra = 0) => `margin-left: ${((ui.level - 1) * 2) + ui.tab - 1 + extra}ch`

export const viewKST = assigns => {
  const { sch, parent, ui } = assigns

  const keyRequired = ifDefined(sch.metadata?.required)
  const keyPattern = ifDefined(sch.metadata?.isKeyPattern)
  const kst = (assigns, { s, extraIndent = 0 }) =>
    html`
    <label class="k box-label" data-required="${keyRequired}" data-is-pattern="${keyPattern}">
      <p class="l">${assigns.key}<span class="t">${typeTextPopulated(assigns.sch, assigns.ui)}</span></p>
      <input type="text" .value="${ifDefined(sch.v)}" data-cmd="noop">
      <p class="err"></p>
    </label>
    `
  const ks = (assigns, { s, extraIndent = 0 }) =>
    html`
    <span class="k" data-required="${keyRequired}" data-is-pattern="${keyPattern}">
      ${editableKey(assigns)}
    </span>
    <span class="t">${typeTextPopulated(assigns.sch, assigns.ui)}</span>
    `

  switch (true) {
    case is(parent, S.data()):
      if (parent.schs[0].$a == sch.$a)
        return editableT(assigns, "call-ctor")
      else
        return nothing

    case isContainer(sch):
      if (is(sch, S.data()))
        return ks(assigns, { s: ":", extraIndent: 2 })
      else
        return ks(assigns, { s: ":" })

    default:
      // leaf
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
