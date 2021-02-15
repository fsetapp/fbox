import { render, html } from "uhtml"
import * as T from "../type.js"

customElements.define("sch-meta", class extends HTMLElement {
  connectedCallback() {
    this.addEventListener("change", this.handleMetaChange)
  }
  disconnectedCallback() {
    this.removeEventListener("change", this.handleMetaChange)
  }
  handleMetaChange(e) {
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
      let detail = {
        path: e.target.closest("[data-path]").dataset.path,
        key: e.target.closest("[data-key]").dataset.key,
        val: ["checkbox", "radio"].includes(e.target.type) ? e.target.checked : e.target.value
      }

      this.dispatchEvent(new CustomEvent("sch-update", { detail: detail, bubbles: true }))
    }
  }
})

export const renderMeta = (container, sch, root) => {
  try {
    render(container, html.for(sch)`
    <p>${sch.key || "-"}</p>
    <section data-path="${sch.path}">
      ${textInput("title", sch.title, { keyDisplay: "Title" })}
      ${textInput("description", sch.description, { keyDisplay: "Description" })}
      ${renderTypeMeta(sch)}
    </section>
  `)
  }
  catch (e) { }
}

const stringInput = (sch) =>
  html``

const labelA = (key, children, opts = {}) => html`
  <label data-key="${key}" class="${opts.readonly && "input readonly" || "input"}">
    <p class="l">${opts.keyDisplay || key} ${opts.readonly && html`<span>· calculated</span>`}</p>
    ${children}
  </label>
  `

const textInput = (key, val, opts = {}) =>
  labelA(key, html`
    <textarea maxlength="${opts.maxlength}" minlength="${opts.minlength}" ?readonly="${opts.readonly}" rows="1" spellcheck="false">${val}</textarea>
  `, opts)

const numberInput = (key, val, opts = {}) =>
  labelA(key, html`
    <input type="number" inputmode="numeric" pattern="[0-9]*" min="${opts.min}" max="${opts.max}" value="${val}" ?readonly="${opts.readonly}">
  `, opts)

const boolInput = (key, val, opts = {}) =>
  labelA(key, html`
    <input type="checkbox" ?readonly="${opts.readonly}" ?checked="${val}">
  `, opts)

const renderTypeMeta = (sch) => {
  let htmls
  switch (true) {
    case sch.type == T.RECORD: htmls = [
      numberInput("min", Object.keys(sch.fields).length, { keyDisplay: "Min Properties", readonly: true }),
      numberInput("max", Object.keys(sch.fields).length, { keyDisplay: "Max Properties", readonly: true })
    ]
      break
    case sch.type == T.LIST: htmls = [
      numberInput("min", 1, { keyDisplay: "Min Items", min: 1 }),
      numberInput("max", sch.max, { keyDisplay: "Max Items", min: 1 }),
      boolInput("unique", sch.unique, { keyDisplay: "Item uniqueness" })
    ]
      break
    case sch.type == T.TUPLE: htmls = [
      numberInput("min", sch.schs.length, { keyDisplay: "Min Items", readonly: true }),
      numberInput("max", sch.schs.length, { keyDisplay: "Max Items", readonly: true })
    ]
      break
    case sch.type == T.STRING: htmls = [
      numberInput("min", sch.min, { keyDisplay: "Min Length", min: 0 }),
      numberInput("max", sch.max, { keyDisplay: "Max Length", min: 0 }),
      textInput("pattern", sch.pattern, { keyDisplay: "Pattern", maxlength: 256 })
    ]
      break
    case sch.type == T.NUMBER: htmls = [
      numberInput("min", sch.min, { keyDisplay: "Min" }),
      numberInput("max", sch.max, { keyDisplay: "Max" }),
      numberInput("multipleOf", sch.multipleOf, { keyDisplay: "Multiple of" })
    ]
      break
    case sch.type == T.INTEGER: htmls = []
    case sch.type == T.BOOLEAN: htmls = []
    case sch.type == T.NULL: htmls = []
    case sch.type == T.UNION: htmls = []
    case sch.type == T.ANY: htmls = []
    case sch.type == T.REF: htmls = []
    case sch.type == T.VALUE: htmls = []
    default: htmls = []
  }

  if (sch._meta.parent.type == T.RECORD && sch._meta.parent._box != T.FMODEL_BOX)
    htmls.push(boolInput("required", sch.required, { keyDisplay: "Required" }))

  return htmls
}
