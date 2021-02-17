import { render, html } from "uhtml"
import * as T from "../type.js"
import * as Meta from "../meta.js"

customElements.define("sch-meta", class extends HTMLElement {
  connectedCallback() {
    this.addEventListener("change", this.handleMetaChange)
  }
  disconnectedCallback() {
    this.removeEventListener("change", this.handleMetaChange)
  }
  handleMetaChange(e) {
    if (e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLSelectElement) {

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
      ${textInput(sch, "title", { keyDisplay: "Title" })}
      ${textInput(sch, "description", { keyDisplay: "Description" })}
      ${renderTypeMeta(sch)}
      ${enumInput(sch, "rw", { collection: [["r", "Readonly"], ["w", "Writeonly"], ["rw", "Read and Write"]], selected: "rw", keyDisplay: "Read / Write" })}
      ${valueInput(sch, "default", { keyDisplay: "Default" })}
    </section>
  `)
  }
  catch (e) { console.log(e) }
}

const labelA = (key, children, opts = {}) => html`
  <label data-key="${key}" class="${opts.readonly && "meta-box readonly" || "meta-box"}">
    <p class="l">${opts.keyDisplay || key} ${opts.readonly && html`<span>· readonly</span>`}</p>
    ${children}
  </label>
  `

const textInput = (sch, key, opts = {}) =>
  labelA(key, html`
    <textarea maxlength="${opts.maxlength}" minlength="${opts.minlength}" ?readonly="${opts.readonly}" rows="1" spellcheck="false">${sch[key] || opts.value}</textarea>
  `, opts)

const numberInput = (sch, key, opts = {}) =>
  labelA(key, html`
    <input type="number" inputmode="numeric" pattern="[0-9]*" min="${opts.min}" max="${opts.max}" value="${sch[key] || opts.value}" ?readonly="${opts.readonly}">
  `, opts)

const boolInput = (sch, key, opts = {}) =>
  labelA(key, html`
    <input type="checkbox" ?disabled="${opts.readonly}" ?checked="${sch[key] || opts.value}">
  `, opts)

const valueInput = (sch, key, opts = {}) => {
  switch (sch.type) {
    case T.BOOLEAN:
      return boolInput(sch, key, opts)
      break
    case T.NUMBER:
      return numberInput(sch, key, opts)
      break
    case T.STRING:
      return textInput(sch, key, opts)
      break
    default:
      return ``
  }
}

const enumInput = (sch, key, opts = {}) =>
  labelA(key, html`
    <select ?disabled="${opts.readonly}">
      ${(opts.collection).map(([v, t]) => html`<option value="${v}" ?selected="${(sch[key] || opts.selected) == v}">${t}</option>`)}
    </select>
  `, opts)

const renderTypeMeta = (sch) => {
  let htmls
  switch (true) {
    case sch.type == T.RECORD: htmls = [
      numberInput(sch, "min", { keyDisplay: "Min Properties", value: Object.keys(sch.fields).length, readonly: true }),
      numberInput(sch, "max", { keyDisplay: "Max Properties", value: Object.keys(sch.fields).length, readonly: true })
    ]
      break
    case sch.type == T.LIST: htmls = [
      numberInput(sch, "min", { keyDisplay: "Min Items", min: 1, value: 1 }),
      numberInput(sch, "max", { keyDisplay: "Max Items", min: 1 }),
      boolInput(sch, "unique", { keyDisplay: "Item uniqueness" })
    ]
      break
    case sch.type == T.TUPLE: htmls = [
      numberInput(sch, "min", { keyDisplay: "Min Items", value: sch.schs.length, readonly: true }),
      numberInput(sch, "max", { keyDisplay: "Max Items", value: sch.max || sch.schs.length })
    ]
      break
    case sch.type == T.STRING: htmls = [
      numberInput(sch, "min", { keyDisplay: "Min Length", min: 0 }),
      numberInput(sch, "max", { keyDisplay: "Max Length", min: 0 }),
      textInput(sch, "pattern", { keyDisplay: "Pattern", maxlength: 256 })
    ]
      break
    case sch.type == T.NUMBER: htmls = [
      numberInput(sch, "min", { keyDisplay: "Min" }),
      numberInput(sch, "max", { keyDisplay: "Max" }),
      numberInput(sch, "multipleOf", { keyDisplay: "Multiple of" })
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
    htmls.push(boolInput(sch, "required", { keyDisplay: "Required" }))

  return htmls
}

const examples = (sch) =>
  Meta.examples(sch).map((example, i) =>
    labelA("examples", html`<pre style="padding: 0 .5rem;"><code>${JSON.stringify(example, null, '  ')}</code></pre>`, { keyDisplay: `Example ${i}` }))
