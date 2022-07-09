import { html, render, nothing } from "lit-html"
import { typeText } from "./model/_type_view.js"
import { viewItself } from "./_iterator_view.js"
import { renderTypeMeta, value, textInput, enumInput, valueInput } from "./sch_meta_view.js"
import "./md_view.js"
import * as M from "../pkgs/model.js"
import { readable } from "../utils.js"

export const renderDefDocs = (sch, store, target) =>
  render(defDocs(sch, store), target)

export const defDocs = (sch, active, store) =>
  html`
  ${descriptionHeader(sch)}
  <div class="defs-docs text-sm">
    ${descriptionList({
    sch,
    path: `[${sch.key}]`,
    parent: { t: M.record().t },
    ui: { models: store._models, rootKey: store.key, lPath: [sch], active }
  })}
  </div>`

const descriptionHeader = (sch) => {
  return html`<p class=""></p>`
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

  switch (sch.uiMode) {
    case "edit":
      return descriptionListEdit(assigns, next)
    default:
      return descriptionListShow(assigns, next)
  }
}

const descriptionListEdit = (assigns, next) => {
  const { sch, path, ui } = assigns

  return html`
  <form data-active="${sch.$a == ui.active.$a}" data-path="${path}">
    <dt class="docs-head">
      <a href="#${path}" class="term-path">${dtKey(ui)}</a>
      <span class="s">:</span>
      <span class="t">${typeText(sch, Object.assign(ui, { showMeta: true }))}</span>
      <button type="submit">save</button>
    </dt>

    <fieldset>
      ${metaForm(assigns)}
    </fieldset>
  </form>
  <hr style="width:100%; border:1px solid var(--gray-meta)">
  ${next}`
}

const descriptionListShow = (assigns, next) => {
  const { sch, path, ui } = assigns

  return html`
  <div data-active="${sch.$a == ui.active.$a}" data-path="${path}">
    <div class="docs-head">
      <a href="#${path}" class="term-path">${dtKey(ui)}</a>
      <span class="s">:</span>
      <span class="t">${typeText(sch, Object.assign(ui, { showMeta: true }))}</span>
      <button data-cmd="edit">edit</button>
    </div>
    <dl class="docs-body">
      ${metaShow(assigns)}
    </dl>
    <hr style="width:100%; border:1px solid var(--gray-meta)">
  </div>
  ${next}`
}

const description = ({ sch }) => {
  if (sch.metadata && sch.metadata.description)
    return html`<dd><t-md>${sch.metadata.description}</t-md></dd>`
  else
    return html`<dd><t-md></t-md></dd>`
}

const metaForm = ({ sch, parent, ui }) => {
  readable(sch, "_meta", { parent, level: ui.level, index: ui.index })

  return html`
    <section>
      <details open>
        <summary></summary>
        <div class="fbox">
          ${textInput(sch, "title", { keyDisplay: "Title" })}
          ${textInput(sch, "description", { keyDisplay: "Description" })}
        </div>
      </details>

      <details>
        <summary>Validation</summary>
        <div class="fbox">
          ${renderTypeMeta(sch)}
          ${enumInput(sch, "rw", { collection: [["r", "Readonly"], ["w", "Writeonly"], ["rw", "Read and Write"]], selected: value(sch, "rw", "rw"), keyDisplay: "Read / Write" })}
          ${valueInput(sch, "default", { keyDisplay: "Default", min: value(sch, "min"), max: value(sch, "max") })}
        </div>
      </details>
    </section>
  `
}

const metaShow = ({ sch, parent, ui }) => {
  readable(sch, "_meta", { parent, level: ui.level, index: ui.index })

  return html`
    ${dlItem(sch, value(sch, "title") || sch.key, {}, value(sch, "description"))}
    ${dlItem(sch, "rw", { optional: true })}
    ${dlItem(sch, "default", { optional: true })}
  `
}

const dlItem = (sch, term, opts = {}, termVal) => {
  const { optional, } = opts
  termVal ||= value(sch, term)

  if (optional)
    switch (true) {
      case termVal == "":
      case termVal == undefined:
        return nothing
      default:
        return html`<dt>${term}</dt><dd>${termVal}</dd>`
    }
  else
    return html`<dt>${term}</dt><dd>${termVal}</dd>`
}

const dtKey = (ui) => {
  const { lPath } = ui

  return lPath.reduce((acc, a, i) => {
    let parent = lPath[i - 1]
    let index = a.i

    if (!parent) return [html`<span>${a.key}</span>`]
    else
      switch (parent.t) {
        case M.E_RECORD: acc.push(html`<span>${{ 0: "e", 1: "r" }[index]}</span>`); break
        case M.DICT: acc.push(html`<span>${{ 0: "k", 1: "v" }[index]}</span>`); break
        default: acc.push(html`<span>${a.key || index}</span>`); break
      }
    return acc
  }, [])
}
