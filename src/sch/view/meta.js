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
        val: e.target.value
      }

      this.dispatchEvent(new CustomEvent("sch-update", { detail: detail, bubbles: true }))
    }
  }
})

export const renderMeta = (container, sch, root) =>
  render(container, html.for(sch)`
    <section id="sch-meta" data-path="${sch.path}">
      <p>${sch.key}</p>
      ${textInput("title", sch.title)}
      ${textInput("description", sch.description)}
      <div>${renderTypeMeta(sch)}
    </section>
  `)

const stringInput = (sch) =>
  html``

const textInput = (key, val) =>
  html`
  <label class="text-input">
    <p class="l">${key}</p>
    <textarea type="text"
      class=""
      data-key="${key}"
      rows="1"
      spellcheck="false"
      >${val}</textarea>
  </label>
  `

const numberInput = (sch) =>
  html``

const renderTypeMeta = (sch) => {
  switch (true) {
    case sch.type == T.RECORD: return ``
    case sch.type == T.LIST: return ``
    case sch.type == T.TUPLE: return ``
    case sch.type == T.STRING: return ``
    case sch.type == T.NUMBER: return ``
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
