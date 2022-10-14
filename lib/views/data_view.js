import { html, nothing } from "lit-html"
import { ifDefined } from "lit-html/directives/if-defined.js"

import { is, isContainer } from "../sch.js"
import * as S from "../pkgs/sheet.js"
import * as M from "../pkgs/model.js"
import * as Core from "../pkgs/core.js"
import { autoResize, autoWidth, cursorEnd, writable, b } from "../utils.js"

import { treeItem, viewItself, groupSize, keyedOrIndexed } from "./_iterator_view.js"
import { diffdata } from "./_diff_view.js"
import * as TypeView from "./model/_type_view.js"

export const byCase = assigns => {
  const { parent, sch, ui } = assigns
  const typestr = ui.structSheet[M.MODULE].toStr[sch.t]

  switch (true) {
    case is(sch, S.data()):
      assigns.item = { nodeclass: "inline-node data", expanded: b(sch.expanded, true) }
      return treeItem(assigns, viewNode)

    case is(parent, S.data()):
      if (parent.schs[0].$a == sch.$a) {
        assigns.item = { nodeclass: "data ctor-name" }
        return treeItem(assigns, viewLeaf)
      }

      assigns.item = { nodeclass: `data ctor-body ${typestr}`, expanded: b(sch.expanded, true) }
      if (parent.schs[0].$r) return treeItem(assigns, viewDataBody)
      else return nothing

    case isContainer(sch):
      assigns.item = { nodeclass: `node data ${typestr}`, expanded: b(sch.expanded, false) }
      return treeItem(assigns, viewData)

    default:
      assigns.item = { nodeclass: `leaf data ${typestr}` }
      return treeItem(assigns, viewLeaf)
  }
}

const viewNode = assigns =>
  html`
  <div class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKST(assigns)}
  </div>
  ${viewItself(assigns, byCase)}`

const viewData = assigns =>
  html`
  <div class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKST(assigns)}
  </div>
  <fieldset data-group="${keyedOrIndexed(assigns.sch)}">${viewItself(assigns, byCase)}</fieldset>
  ${newItemBtn(assigns)}`

const viewDataBody = assigns =>
  html`
  <fieldset data-group="${keyedOrIndexed(assigns.sch)}">${viewItself(assigns, byCase)}</fieldset>
  ${newItemBtn(assigns)}`

const viewLeaf = assigns =>
  viewKST(assigns)

const indent = ({ ui }, extra = 0) => `padding-left: ${((ui.level - 1) * 3) + ui.tab - 1 + extra}ch`
const indentm = ({ ui }, extra = 0) => `margin-left: ${((ui.level - 1) * 3) + ui.tab - 1 + extra}ch`

const newItemBtn = assigns => {
  const { sch, parent, ui } = assigns

  if (sch.m == S.MODULE)
    switch (sch.t) {
      case M.LIST:
      case M.DICT:
        return html`<button data-cmd="new-item">+</button>`
      default:
        return nothing
    }
}

export const viewKST = assigns => {
  const { sch, parent, ui } = assigns

  const keyRequired = ifDefined(sch.metadata?.required)
  const keyPattern = ifDefined(sch.metadata?.isKeyPattern)

  switch (true) {
    case is(parent, S.data()):
      if (parent.schs[0].$a == sch.$a && !parent.schs[1])
        return editableT(assigns, "call-ctor")
      else if (parent.schs[0].$a == sch.$a && parent.schs[1])
        return html`<span class="t">${typeText({ sch, ui, parent })}</span>`
      else
        return nothing

    case parent.t == M.ENUM:
    case parent.t == M.UNION:
      return html`<label><input type="radio" name="${parent.$a}" value="${sch.$a}">${valInput(assigns)}</label>`

    case parent.t == M.TAGGED_UNION:
      return html`<label>
        <input type="radio" name="${parent.$a}" value="${sch.$a}">
        <span class="k" data-cmd="toggle">${assigns.key}</span>
        ${valInput(assigns)}
      </label>`

    case sch.tag == Core.TOPLV_TAG:
      return html`
      <span class="k editable" data-required="${keyRequired}" data-is-pattern="${keyPattern}">
        ${editableKey(assigns)}
      </span>`

    case isContainer(sch):
      // <svg style="width:1.25rem;height:1.25rem;align-self:center;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"><path stroke="#6b7280" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6 8l4 4 4-4"/></svg>
      return html`
      <span class="k" data-cmd="toggle" data-required="${keyRequired}" data-is-pattern="${keyPattern}">
        ${assigns.key}
      </span>`

    default:
      // leaf
      return html`<label data-text="${ifDefined(sch.v)}"><span class="k">${assigns.key}</span>${valInput(assigns)}</label>`
  }
}

const editableKey = ({ sch, ui, key }) =>
  sch.uiMode == "editKey" ?
    textInput("key-edit", ui.parentId, key) :
    key

const editableT = ({ sch, ui, parent }, inputId) =>
  sch.uiMode == "editType" ?
    html`<combo-box class="t" id="type_search" list="typesearch">${textInput(inputId, ui.parentId, typeTextPopulated(sch, ui))}</combo-box>` :
    html`<span class="t">${typeText({ sch, ui, parent })}</span>`

const valInput = assigns => {
  const { sch, ui } = assigns
  const val = sch_ => ifDefined(sch_.v)
  const o = c => {
    let v = (sch.metadata || {})[c]
    if (v == "") v = undefined
    return ifDefined(v)
  }

  const value = sch.metadata?.defualt || val(sch)
  switch (true) {
    case sch.t == M.STRING:
      return html`<input type="text" minLength="${o("min")}" maxLength="${o("max")}" pattern="${o("pattern")}" .value="${value}" @input="${autoWidth(2)}"></input>`
    case sch.t == M.BOOLEAN:
      return html`<input type="checkbox" checked=${sch.v} .value="${value}"></input>`
    case sch.t == M.INT8:
    case sch.t == M.INT16:
    case sch.t == M.INT32:
    case sch.t == M.UINT8:
    case sch.t == M.UINT16:
    case sch.t == M.UINT32:
      let range = ui.structSheet[M.MODULE].attrs[sch.t]
      return html`<input type="number" @input="${autoWidth(5)}" min=${range.min} max=${range.max} multipleOf="${o("multipleOf")}" format="${o("format")}" .value="${value}"></input>`
    case sch.t == M.INTEGER:
      return html`<input type="number" @input="${autoWidth(5)}" min=${o("min")} max=${o("max")} multipleOf="${o("multipleOf")}" format="${o("format")}" .value="${value}"></input>`
    case sch.t == M.FLOAT32:
      return html`<input type="number" @input="${autoWidth(5)}" min=${o("min")} max=${o("max")} format="${o("format")}" .value="${value}"></input>`
    case sch.t == M.FLOAT64:
      return html`<input type="number" @input="${autoWidth(5)}" min=${o("min")} max=${o("max")} format="${o("format")}" .value="${value}"></input>`
  }
}

const textInput = (id, parentId, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-id="${parentId}"
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
  ui.isData = true

  switch (true) {
    case is(sch, S.data()):
      return "data"

    case is(parent, S.data()) && !parent.schs[0].$r:
      return "choose schema"

    case is(parent, S.data()) && parent.schs[0].$r:
      writable(sch, "_text", TypeView.typeTextPopulated(sch, ui))
      return html`<button class="ref" ._a="${sch.$r}" ._assigns="${assigns}">${sch._text}</button>`

    case is(sch, Core.ref()):
      writable(sch, "_text", TypeView.typeTextPopulated(sch, ui))
      return html`<button class="ref" ._a="${sch.$r}" ._assigns="${assigns}">${sch._text}</button>`

    default:
      return TypeView.typeText(sch, ui)
  }
}
