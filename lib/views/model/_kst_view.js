import { html } from "lit-html"
import { ifDefined } from "lit-html/directives/if-defined.js"

import { is } from "../../sch.js"
import * as M from "../../pkgs/model.js"
import * as TypeView from "../model/_type_view.js"
import { autoResize, cursorEnd } from "../../utils.js"

const indent = ({ ui }, extra = 0) => `padding-left: ${((ui.level - 1) * 2) + ui.tab - 1 + extra}ch`

export default assigns => {
  const { sch, parent } = assigns

  const editTMode = sch.hasOwnProperty("v") ? "val-edit" : "type-edit"
  const keyRequired = ifDefined(sch.metadata?.required)
  const keyPattern = ifDefined(sch.metadata?.isKeyPattern)
  const kst = (assigns, { s }) =>
    html`
    <span class="k" style="${indent(assigns)}" data-required="${keyRequired}" data-is-pattern="${keyPattern}">${editableKey(assigns)}</span>
    <span class="s">${s}</span>
    ${editableT(assigns, editTMode)}
    `
  const st = (assigns, { s }) =>
    html`
    <span class="s" style="${indent(assigns)}">${s}</span>
    ${editableT(assigns, editTMode)}
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
        ${editableT(assigns, "type-edit")}
      `

    default:
      return kst(assigns, { s: ":" })
  }
}

const textInput = (id, parentId, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-id="${parentId}"
  data-newline="false"
  @input="${autoResize}"
  @focus="${cursorEnd}"
  .value=${content}></textarea>`

const editableKey = ({ sch, ui, key }) =>
  sch.uiMode == "editKey" ?
    textInput("key-edit", ui.parentId, key) :
    key

const editableT = ({ sch, ui }, inputId) =>
  sch.uiMode == "editType" ?
    html`<combo-box class="t" id="type_search" list="typesearch">${textInput(inputId, ui.parentId, TypeView.typeTextPopulated(sch, ui))}</combo-box>` :
    html`<span class="t">${TypeView.typeText(sch, ui)}</span>`
