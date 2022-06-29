import { html, render } from "lit-html"
import { typeText } from "./model/_type_view.js"
import { viewItself } from "./_iterator_view.js"
import { renderTypeMeta } from "./sch_meta_view.js"
import "./md_view.js"
import * as M from "../pkgs/model.js"

export const renderDefDocs = (sch, store, target) =>
  render(defDocs(sch, store), target)

export const defDocs = (sch, store) =>
  html`
  ${descriptionHeader(sch)}
  <ul>
    ${descriptionList({ sch, path: "", ui: { models: store._models, rootKey: store.key } })}
  </ul>`

const descriptionHeader = (sch) => {
  switch (true) {
    case [M.RECORD, M.E_RECORD].includes(sch.t):
      return html`<p class="defs-docs">Fields Description</p>`

    case [M.TUPLE, M.LIST].includes(sch.t):
      return html`<p class="defs-docs">Elements Description</p>`

    case [M.DICT].includes(sch.t):
      return html`<p class="defs-docs">K V Description</p>`

    case [M.UNION, M.TAGGED_UNION].includes(sch.t):
      return html`<p class="defs-docs">Cases Description</p>`
  }
}

const descriptionList = assigns => {
  const { sch, ui } = assigns
  switch (true) {
    case !!sch.fields || !!sch.schs || !!sch.sch:
      return viewItself(assigns, descriptionList)

    default:
      return html`<li>
        <dl>
          <dt>
            <a href="#${ui.path}" class="k">${dtKey(sch, parent, ui)}</a>
            <span class="s">:</span>
            <span class="t">${typeText(sch, Object.assign(ui, { showMeta: true }))}</span>
          </dt>

          ${(sch.metadata && sch.metadata.description) ? html`<dd><t-md>${sch.metadata.description}</t-md></dd>` : html`<dd><t-md></t-md></dd>`}
        </dl>
      </li>`
  }
}

const dtKey = (sch, parent, { index }) => {
  switch (parent.t) {
    case M.E_RECORD: return { 0: "e", 1: "r" }[index]
    case M.DICT: return { 0: "k", 1: "v" }[index]
    default: return sch.key || index
  }
}
