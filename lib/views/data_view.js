import { html, nothing } from "lit-html"
import { ifDefined } from "lit-html/directives/if-defined.js"

import { is, isContainer } from "../sch.js"
import * as S from "../pkgs/sheet.js"
import * as M from "../pkgs/model.js"
import * as Core from "../pkgs/core.js"
import { autoResize, cursorEnd, writable } from "../utils.js"

import { treeItem, viewItself, groupSize, keyedOrIndexed } from "./_iterator_view.js"
import { diffdata } from "./_diff_view.js"
import * as TypeView from "./model/_type_view.js"

export const byCase = assigns => {
  const { parent, sch, ui } = assigns
  const typestr = ui.structSheet[sch.m].toStr[sch.t]

  switch (true) {
    case is(sch, S.data()):
      assigns.item = { nodeclass: "inline-node data", expanded: true }
      return treeItem(assigns, viewNode)

    case is(parent, S.data()):
      if (parent.schs[0].$a == sch.$a) {
        assigns.item = { nodeclass: "data ctor-name" }
        return treeItem(assigns, viewLeaf)
      }

      if (parent.schs[1]?.$a == sch.$a) {
        if (ui.columnIndex != ui._columns[sch.$a]?.ui.columnIndex) {
          return nothing
        }

        assigns.item = { nodeclass: "data ctor-body", expanded: true }
        if (parent.schs[0].$r) return treeItem(assigns, viewDataBody)
        else return nothing
      }
      break

    case isContainer(sch):
      assigns.item = { nodeclass: `node data ${typestr}`, expanded: true }
      return treeItem(assigns, viewDataBody)

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

const viewDataBody = assigns =>
  html`
  <div class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKST(assigns)}
  </div>
  <fieldset class="fbox" data-group="${keyedOrIndexed(assigns.sch)}">${viewItself(assigns, byCase)}</fieldset>
  ${newItemBtn(assigns)}`

const viewLeaf = assigns =>
  viewKST(assigns)

const indent = ({ ui }, extra = 0) => `padding-left: ${((ui.level - 1) * 2) + ui.tab - 1 + extra}ch`
const indentm = ({ ui }, extra = 0) => `margin-left: ${((ui.level - 1) * 2) + ui.tab - 1 + extra}ch`

const newItemBtn = assigns => {
  const { sch, parent, ui } = assigns
  switch (true) {
    case is(sch, M.list()):
      return html`<button data-cmd="new-item">+ New ${sch.sch.key}</button>`
    case is(sch, M.dict()):
      return html`<button data-cmd="new-item">+ New ${sch.key}</button>`
    default:
      return nothing
  }
}

export const viewKST = assigns => {
  const { sch, parent, ui } = assigns

  const keyRequired = ifDefined(sch.metadata?.required)
  const keyPattern = ifDefined(sch.metadata?.isKeyPattern)
  const kst = (assigns) =>
    html`
    <label class="k box-label" data-required="${keyRequired}" data-is-pattern="${keyPattern}">
      <p class="l"><span>${assigns.key}</span></p>
      ${valInput(assigns)}
      <p class="err"></p>
    </label>
    `
  const kt = (assigns) =>
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

    case is(sch, Core.ref()):
      return html`
      <label class="k box-label" data-required="${keyRequired}" data-is-pattern="${keyPattern}">
        <p class="l"><span>${assigns.key}</span><span class="t">${typeText(assigns)}</span></p>
        <p class="l"><span>${assigns.key}</span>${editableT(assigns, "call-ctor")}</p>
      </label>`

    case isContainer(sch):
      return html`
      <span class="k" data-required="${keyRequired}" data-is-pattern="${keyPattern}">
        ${editableKey(assigns)}
      </span>`

    default:
      // leaf
      return kst(assigns)
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

const valInput = assigns => {
  const { sch, ui } = assigns
  const val = sch_ => ifDefined(sch_.v)

  switch (true) {
    case is(sch, M.string()):
      return html`<input type="text" .value="${val(sch)}" data-cmd="validate"></input>`
    case is(sch, M.bool()):
      return html`<input type="checkbox" checked=${sch.v} .value="${val(sch)}" data-cmd="validate"></input>`
    case is(sch, M.int8()):
    case is(sch, M.int16()):
    case is(sch, M.int32()):
    case is(sch, M.uint8()):
    case is(sch, M.uint16()):
    case is(sch, M.uint32()):
      let range = ui.structSheet[sch.m].attrs[sch.t]
      return html`<input type="number" min=${range.min} max=${range.max} .value="${val(sch)}" data-cmd="validate"></input>`
    case is(sch, M.integer()):
      return html`<input type="number" min=${ifDefined(sch?.metadata?.min)} max=${ifDefined(sch?.metadata?.max)} .value="${val(sch)}" data-cmd="validate"></input>`
    case is(sch, M.float32()):
      return html`<input type="number" min=${ifDefined(sch?.metadata?.min)} max=${ifDefined(sch?.metadata?.max)} .value="${val(sch)}" data-cmd="validate"></input>`
    case is(sch, M.float64()):
      return html`<input type="number" min=${ifDefined(sch?.metadata?.min)} max=${ifDefined(sch?.metadata?.max)} .value="${val(sch)}" data-cmd="validate"></input>`
  }
}

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
  ui.isData = true

  switch (true) {
    case is(sch, S.data()):
      return "data"

    case is(parent, S.data()) && !parent.schs[0].$r:
      return "_"

    case is(parent, S.data()) && parent.schs[0].$r:
      writable(sch, "_text", TypeView.typeTextPopulated(sch, ui))
      return html`<button data-cmd="next-page" class="ref" ._a="${sch.$r}" ._assigns="${assigns}">${sch._text}</button>`

    // case is(parent, S.data()):
    //   return TypeView.typeText(sch, ui)

    case is(sch, Core.ref()):
      writable(sch, "_text", TypeView.typeTextPopulated(sch, ui))
      return html`<button data-cmd="next-page" class="ref" ._a="${sch.$r}" ._assigns="${assigns}">${sch._text}</button>`

    default:
      return TypeView.typeText(sch, ui)
  }
}
