import { html, render, nothing } from "lit-html"
import { typeText } from "./model/_type_view.js"
import { viewItself } from "./_iterator_view.js"
import { renderTypeMeta } from "./sch_meta_view.js"
import "./md_view.js"
import * as M from "../pkgs/model.js"

export const renderDefDocs = (sch, store, target) =>
  render(defDocs(sch, store), target)

export const defDocs = (sch, active, store) =>
  html`
  ${descriptionHeader(sch)}
  <dl class="text-sm">
    ${descriptionList({ sch, path: "", ui: { models: store._models, rootKey: store.key, lPath: [sch], active } })}
  </dl>`

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
  let next = nothing

  switch (true) {
    case !!sch.fields || !!sch.schs || !!sch.sch:
      next = viewItself(assigns, descriptionList)
      break
  }

  return html`
  <div data-active="${sch.$a == ui.active.$a}">
    <dt>
      <p class="term-path">${dtKey(ui)}</p>
      <span class="s">:</span>
      <span class="t">${typeText(sch, Object.assign(ui, { showMeta: true }))}</span>
    </dt>

    ${(sch.metadata && sch.metadata.description) ? html`<dd><t-md>${sch.metadata.description}</t-md></dd>` : html`<dd><t-md></t-md></dd>`}
  </div>
  ${next}`
}

const dtKey = (ui) => {
  const { lPath } = ui

  return lPath.reduce((acc, a, i) => {
    let parent = lPath[i - 1]
    let index = a.i

    if (!parent) return acc
    else
      switch (parent.t) {
        case M.E_RECORD: acc.push(html`<span>${{ 0: "e", 1: "r" }[index]}</span>`); break
        case M.DICT: acc.push(html`<span>${{ 0: "k", 1: "v" }[index]}</span>`); break
        default: acc.push(html`<span>${a.key || index}</span>`); break
      }
    return acc
  }, [])
}
