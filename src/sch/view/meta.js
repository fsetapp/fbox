import { render, html } from "uhtml"
import * as T from "../type.js"

customElements.define("sch-meta", class extends HTMLElement {
  connectedCallback() {
    this.addEventListener("focusout", this.handleMetaChange)
  }
  disconnectedCallback() {
    this.removeEventListener("focusout", this.handleMetaChange)
  }
  handleMetaChange(e) {
    if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
      let detail = {
        path: e.target.closest("[data-path]").dataset.path,
        key: e.target.dataset.key,
        val: ["checkbox", "radio"].includes(e.target.type) ? e.target.checked : e.target.value
      }

      this.dispatchEvent(new CustomEvent("sch-update", { detail: detail, bubbles: true }))
    }
  }
})

export const renderMeta = (container, sch, root) => {
  try {
    render(container, html.for(sch)`
    <section data-path="${sch.path}">
      <p>${sch.key || "-"}</p>
      ${textInput("title", sch.title)}
      ${textInput("description", sch.description)}
      ${renderTypeMeta(sch)}
    </section>
  `)
  }
  catch (e) { }
}

const stringInput = (sch) =>
  html``

const labelA = (key, children, opts = {}) => html`
  <label class="${opts.readonly && "input readonly" || "input"}">
    <p class="l">${opts.keyDisplay || key} ${opts.readonly && html`<span>· readonly</span>`}</p>
    ${children}
  </label>
  `

const textInput = (key, val, opts = {}) =>
  labelA(key, html`
    <textarea data-key="${key}" maxlength="${opts.maxlength}" minlength="${opts.minlength}" ?readonly="${opts.readonly}" rows="1" spellcheck="false">${val}</textarea>
  `, opts)

const numberInput = (key, val, opts = {}) =>
  labelA(key, html`
    <input type="number" inputmode="numeric" pattern="[0-9]*" min="${opts.min}" max="${opts.max}" data-key="${key}" value="${val}" ?readonly="${opts.readonly}">
  `, opts)

const boolInput = (key, val, opts = {}) =>
  labelA(key, html`
    <input type="checkbox" data-key="${key}" data-value="${val}" ?readonly="${opts.readonly}">
  `, opts)

const renderTypeMeta = (sch) => {
  switch (true) {
    case sch.type == T.RECORD: return [
      numberInput("min", Object.keys(sch.fields).length, { keyDisplay: "Min Properties", readonly: true }),
      numberInput("max", Object.keys(sch.fields).length, { keyDisplay: "Max Properties", readonly: true })
    ]

    case sch.type == T.LIST: return [
      numberInput("min", 1, { keyDisplay: "Min Items", min: 1 }),
      numberInput("max", null, { keyDisplay: "Max Items", min: 1 }),
      boolInput("unique", null, { keyDisplay: "Item uniqueness" })
    ]

    case sch.type == T.TUPLE: return [
      numberInput("min", sch.schs.length, { keyDisplay: "Min Items", readonly: true }),
      numberInput("max", sch.schs.length, { keyDisplay: "Max Items", readonly: true })
    ]

    case sch.type == T.STRING: return [
      numberInput("min", null, { keyDisplay: "Min Length", min: 0 }),
      numberInput("max", null, { keyDisplay: "Max Length", min: 0 }),
      textInput("pattern", "", { maxlength: 256 })
    ]

    case sch.type == T.NUMBER: return [
      numberInput("min"),
      numberInput("max"),
      numberInput("multipleOf")
    ]

    case sch.type == T.INTEGER: return ``
    case sch.type == T.BOOLEAN: return ``
    case sch.type == T.NULL: return ``
    case sch.type == T.UNION: return ``
    case sch.type == T.ANY: return ``
    case sch.type == T.REF: return ``
    case sch.type == T.VALUE: return ``
    default: return ``
  }
}
