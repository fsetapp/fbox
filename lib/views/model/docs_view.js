import { render, html, nothing } from "lit-html"
import { repeat } from "lit-html/directives/repeat.js"

import { typeText } from "./_type_view.js"
import { viewItself } from "../_iterator_view.js"
import { textInput, enumInput } from "../_form_inputs.js"
import { renderTypeMeta, value, valueInput } from "../model/_meta_inputs.js"
import "../md_view.js"
import * as M from "../../pkgs/model.js"
import { MODULE as DATA } from "../../pkgs/sheet.js"

export const renderBlankMeta = (container) => {
  container = document.querySelector(container)
  container.classList.add("hidden")

  render(repeat([{ $a: "nothing" }], sch => sch.$a, sch => nothing), container)
}

export const renderMeta = (container, sch, selected, root) => {
  container = document.querySelector(container)
  container.classList.remove("hidden")

  try {
    let referrers = sch.referrers || []

    render(repeat([sch], sch => sch.$a, sch => html`
    <div data-file=${root.key} .file="${root}">
      ${defDocs(sch, selected, root)}
    </div>
  `), container)
  }
  catch (e) { console.log(e); }
}

export const defDocs = (sch, active, store) =>
  html`
  <p class=""></p>
  <div class="defs-docs text-sm">
    ${descriptionList({
    sch,
    path: `[${sch.key}]`,
    parent: { t: M.record().t },
    ui: { models: store._models, rootKey: sch.key, lPath: [sch], active, indices: store._indices }
  })}
  </div>`

const descriptionList = assigns => {
  const { sch, ui } = assigns
  let next = nothing
  if (sch.m == DATA) {
    const sch_ = ui.indices[sch.$r] || ui.indices[sch.schs[1].$r]
    sch.metadata ||= sch_.metadata
  }


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
  <form data-active="${sch.$a == ui.active.$a}" .sch="${sch}" data-anchor="${sch.$a}">
    <dt class="docs-head ${sch.key == ui.rootKey ? "root" : ""}">
      <a href="#${path}" class="term-path">${dtKey(ui)}</a>
      <span class="s">:</span>
      <span class="t">${typeText(sch, Object.assign(ui, { showMeta: true }))}</span>
      <button type="submit">save</button>
      <button data-cmd="cancel">cancel</button>
    </dt>

    <fieldset>
      ${metaForm(assigns)}
    </fieldset>
  </form>
  ${next}`
}

const descriptionListShow = (assigns, next) => {
  const { sch, path, ui } = assigns

  return html`
  <div data-active="${sch.$a == ui.active.$a}" .sch="${sch}" data-anchor="${sch.$a}">
    <div class="docs-head ${sch.key == ui.rootKey ? "root" : ""}">
      <a href="#${path}" class="term-path">${dtKey(ui)}</a>
      <span class="s">:</span>
      <span class="t">${typeText(sch, Object.assign(ui, { showMeta: true }))}</span>
      <button data-cmd="edit">edit</button>
    </div>
    <dl class="docs-body">
      ${metaShow(assigns)}
    </dl>
  </div>
  ${next}`
}

const metaForm = ({ sch, parent, ui }) => {
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
        return html`<dt>${display || term}</dt><dd><t-md>${termVal}</t-md></dd>`
    }
  else
    return html`<dt>${display || term}</dt><dd><t-md>${termVal}</t-md></dd>`
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
          case M.E_RECORD: acc.push(html`<span>${{ 0: "e", 1: "r" }[index]}</span>`); break
          case M.DICT: acc.push(html`<span>${{ 0: "k", 1: "v" }[index]}</span>`); break
          case M.TAGGED_UNION: acc.push(html`<span>| ${a.key}</span>`); break
          case M.UNION: acc.push(html`<span>|</span>`); break
          default: acc.push(html`<span>${a.key || index}</span>`); break
        }
      return acc
    }, [])
}
