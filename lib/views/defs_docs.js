import { html, nothing, render } from "lit-html"
import { repeat } from 'lit-html/directives/repeat.js'
import { typeText } from "./_type_view.js"
import "./md_view.js"
import * as T from "../sch/type.js"

export const renderDefDocs = (sch, store, target) =>
  render(defDocs(sch, store), target)

export const defDocs = (sch, store) =>
  html`
  ${descriptionHeader(sch)}
  <ul>
    ${descriptionList(sch, { models: store._models, path: "", rootKey: store.key })}
  </ul>`

const descriptionHeader = (sch) => {
  switch (true) {
    case [T.RECORD, T.E_RECORD].includes(sch.t):
      return html`<p class="defs-docs">Fields Description</p>`

    case [T.TUPLE, T.LIST].includes(sch.t):
      return html`<p class="defs-docs">Elements Description</p>`

    case [T.DICT].includes(sch.t):
      return html`<p class="defs-docs">K V Description</p>`

    case [T.UNION, T.TAGGED_UNION].includes(sch.t):
      return html`<p class="defs-docs">Cases Description</p>`
  }
}

const descriptionList = (parent, ui) => {
  switch (true) {
    case parent.hasOwnProperty("fields"):
      return repeat(parent.fields, (sch) => sch.$a, (sch, i) => dl({
        key: sch.key,
        m: sch.metadata,
        sch,
        ui: { ...ui, path: `${parentPath(parent, ui)}[${sch.key}]` }
      }))

    case parent.hasOwnProperty("schs"):
      return repeat(parent.schs, (sch) => sch.$a, (sch, i) => dl({
        key: namedIndex(parent, i),
        m: sch.metadata,
        sch,
        ui: { ...ui, path: `${parentPath(parent, ui)}[][${i}]` }
      }))
    case parent.hasOwnProperty("sch"):
      return dl({
        key: "└",
        m: parent.sch.metadata,
        sch: parent.sch,
        ui: { ...ui, path: `${parentPath(parent, ui)}[][${0}]` }
      })
  }
}

const parentPath = (parent, ui) => parent._meta.path.replace(`[${ui.rootKey}]`, "")
const namedIndex = (sch, i) => {
  switch (sch.t) {
    case T.E_RECORD: return { 0: "e", 1: "r" }[i]
    case T.DICT: return { 0: "k", 1: "v" }[i]
    default: return i
  }
}

const dl = ({ key, sch, ui, m }) =>
  html`<li>
  <dl>
    <dt>
      <a href="#${ui.path}" class="k">${key}</a>
      <span class="s">:</span>
      <span class="t">${typeText(sch, ui)}</span>
    </dt>
    ${(m && m.description) ? html`<dd><t-md>${m.description}</t-md></dd>` : html`<dd><t-md>–––</t-md></dd>`}
  </dl>
</li>`
