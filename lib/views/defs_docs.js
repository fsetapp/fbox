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
  <form data-active="${sch.$a == ui.active.$a}" data-anchor="${sch.$a}">
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
  <hr style="width:100%; border:1px solid var(--gray-meta); margin: .5rem 0">
  ${next}`
}

const descriptionListShow = (assigns, next) => {
  const { sch, path, ui } = assigns

  return html`
  <div data-active="${sch.$a == ui.active.$a}" data-anchor="${sch.$a}">
    <div class="docs-head">
      <a href="#${path}" class="term-path">${dtKey(ui)}</a>
      <span class="s">:</span>
      <span class="t">${typeText(sch, Object.assign(ui, { showMeta: true }))}</span>
      <button data-cmd="edit">edit</button>
    </div>
    <dl class="docs-body">
      ${metaShow(assigns)}
    </dl>
    <hr style="width:100%; border:1px solid var(--gray-meta); margin: .5rem 0">
  </div>
  ${next}`
}

const metaForm = ({ sch, parent, ui }) => {
  readable(sch, "_meta", { parent, level: ui.level, index: ui.index })

  return html`
    <div class="fbox">
      <p></p>
      ${textInput(sch, "title", { keyDisplay: "Title" })}
      ${textInput(sch, "description", { keyDisplay: "Description" })}
    </div>

    <div class="fbox">
      <p>Validation</p>
      ${renderTypeMeta(sch)}
      ${enumInput(sch, "rw", { collection: [["r", "Readonly"], ["w", "Writeonly"], ["rw", "Read and Write"]], selected: value(sch, "rw", "rw"), keyDisplay: "Read / Write" })}
      ${valueInput(sch, "default", { keyDisplay: "Default", min: value(sch, "min"), max: value(sch, "max") })}
    </div>
  `
}

const metaShow = ({ sch, parent, ui }) => {
  readable(sch, "_meta", { parent, level: ui.level, index: ui.index })

  return html`
    ${dlItem(sch, value(sch, "title") || sch.key, {}, value(sch, "description"))}
    ${dlItem(sch, "rw", { display: "Read / Write", optional: true, default_: "rw" })}
    ${dlItem(sch, "default", { optional: true })}
  `
}

const dlItem = (sch, term, opts = {}, termVal) => {
  const { optional, display, default_ } = opts
  termVal ||= value(sch, term)

  if (optional)
    switch (true) {
      case termVal == "":
      case termVal == undefined:
      case termVal == default_:
        return nothing
      default:
        return html`<dt>${display || term}</dt><dd><t-md>${termVal}</t-md></dd>`
    }
  else
    return html`<dt>${display || term}</dt><dd><t-md>${termVal}</t-md></dd>`
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
        case M.TAGGED_UNION: acc.push(html`<span>| ${a.key}</span>`); break
        case M.UNION: acc.push(html`<span>|</span>`); break
        default: acc.push(html`<span>${a.key || index}</span>`); break
      }
    return acc
  }, [])
}
