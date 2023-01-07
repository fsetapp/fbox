import { render, html, nothing } from "lit-html"
import { repeat } from "lit-html/directives/repeat.js"

import { renderTypeMeta, value, valueInput } from "./_meta_inputs.js"
import { typeText } from "./_type_view.js"
import { viewItself } from "../_iterator_view.js"
import { textInput, enumInput } from "../_form_inputs.js"
import "../md_view.js"
import { K as M_, C as M } from "../../pkgs/model.js"
import { isContainer } from "../../sch.js"

export const renderBlankMeta = (container) => {
  container = document.querySelector(container)
  container.classList.add("hidden")

  render(repeat([{ $a: "nothing" }], sch => sch.$a, sch => nothing), container)
}

export const renderMeta = (container, sch, selected, store, ui) => {
  let referrers = sch.referrers || []
  container = document.querySelector(container)
  container.classList.remove("hidden")

  try {
    render(html`<div data-file=${store.key} .file="${store}">${docs(sch, selected, store, ui)}</div>`, container)
  }
  catch (e) { console.log(e); }
}

const docs = (sch, active, store, ui) =>
  html`
  <div class="defs-docs text-sm">
    ${descriptionList({
    sch,
    path: `[${sch.key}]`,
    parent: { t: M.record().t },
    ui: { ...ui, models: store._models, rootKey: sch.key, lPath: [sch], active, indices: store._indices }
  })}
  </div>`

const descriptionList = assigns => {
  const { sch, ui } = assigns
  let next = nothing

  switch (true) {
    case isContainer(sch):
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
  <form data-active="${ui.selected}" .sch="${sch}" data-anchor="${sch.$a}">
    <dt class="docs-head ${sch.key == ui.rootKey ? "root" : ""}">
      <a href="#${path}" class="term-path">${dtKey(ui)}</a>
      <span class="s">:</span>
      <span class="t">${typeText(sch, Object.assign(ui, { showMeta: true }))}</span>
      <button type="submit">save</button>
      <button data-cmd="cancel">cancel</button>
    </dt>

    <fieldset class="docs-body">
      ${metaForm(assigns)}
    </fieldset>
  </form>
  ${next}`
}

const descriptionListShow = (assigns, next) => {
  const { sch, path, ui } = assigns

  return html`
  <div data-active="${sch.selected}" .sch="${sch}" data-anchor="${sch.$a}">
    <div class="docs-head ${sch.key == ui.rootKey ? "root" : ""}">
      <a href="#${path}" class="term-path">${dtKey(ui)}</a>
      <span class="s">:</span>
      <span class="t">${typeText(sch, Object.assign(ui, { showMeta: true }))}</span>
      <button data-cmd="edit">edit</button>
    </div>
    <dl class="docs-body">
      ${metaShow(assigns)}
    </dl>
    <div aria-expanded="${sch.expanded}">
      ${next}
    </div>
  </div>`
}

const metaForm = ({ sch, parent, ui }) => {
  return html`
    <div class="fbox">
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
  return html`
    ${dlItem(sch, value(sch, "title"), {}, value(sch, "description"))}
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
        return html`<div><dt>${display || term}</dt><dd><t-md>${termVal}</t-md></dd></div>`
    }
  else
    return html`<div><dt>${display || term}</dt><dd><t-md>${termVal}</t-md></dd></div>`
}

const dtKey = (ui) => {
  const { lPath } = ui

  if (lPath.length == 1)
    return [html`<span>${lPath[0].key}</span>`]
  else
    return lPath.reduce((acc, a, i) => {
      let parent = lPath[i - 1]
      let index = a.i

      if (!parent) return []
      else
        switch (parent.t) {
          case M_.E_RECORD: acc.push(html`<span>${{ 0: "e", 1: "r" }[index]}</span>`); break
          case M_.DICT: acc.push(html`<span>${{ 0: "k", 1: "v" }[index]}</span>`); break
          case M_.TAGGED_UNION: acc.push(html`<span>| ${a.key}</span>`); break
          case M_.UNION: acc.push(html`<span>|</span>`); break
          default: acc.push(html`<span>${a.key || index}</span>`); break
        }
      return acc
    }, [])
}
