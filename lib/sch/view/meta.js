import { render, html } from "uhtml"
import * as T from "../type.js"
import * as Meta from "../meta.js"
import { autoResize } from "../../utils.js"

customElements.define("sch-meta", class extends HTMLElement {
  connectedCallback() {
    this.addEventListener("change", this.handleMetaChange)
    this.addEventListener("input", this.handleMetaChange)
    this.addEventListener("paste", this.handleMetaChange)
    this.addEventListener("focusout", this.handleMetaChange)
  }
  disconnectedCallback() {
    this.removeEventListener("change", this.handleMetaChange)
    this.removeEventListener("input", this.handleMetaChange)
    this.removeEventListener("paste", this.handleMetaChange)
    this.removeEventListener("focusout", this.handleMetaChange)
  }
  handleMetaChange(e) {
    if (e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLSelectElement) {

      const value = (input) => {
        if (["checkbox", "radio"].includes(input.type)) return input.checked
        else return input.value
      }

      let inputs = this.querySelector("form").elements
      let post = {}
      for (let i = 0; i < inputs.length; i++) {
        let val = value(inputs[i])
        if (!(inputs[i] instanceof HTMLTextAreaElement) && val == "") continue

        post[inputs[i].name] = val
      }

      let detail = {
        path: e.target.closest("[data-path]").dataset.path,
        file: e.target.closest("[data-file]").dataset.file,
        attrs: post
      }
      this.dispatchEvent(new CustomEvent("sch-update", { detail: detail, bubbles: true }))
    }
  }
})

export const renderMeta = (container, sch, root) => {
  try {
    render(container, html.for(sch)`
    <p>${sch.key || "-"}</p>
    <form data-path="${sch.path}" data-file="${sch.rootKey}">
      ${textInput(sch, "title", { keyDisplay: "Title" })}
      ${textInput(sch, "description", { keyDisplay: "Description" })}
      ${renderTypeMeta(sch)}
      ${enumInput(sch, "rw", { collection: [["r", "Readonly"], ["w", "Writeonly"], ["rw", "Read and Write"]], selected: "rw", keyDisplay: "Read / Write" })}
      ${valueInput(sch, "default", { keyDisplay: "Default" })}
    </form>
  `)
  }
  catch (e) { }
}

const labelA = (sch, key, children, opts = {}) => html`
  <label class="${opts.readonly && `meta-box ${key} readonly` || `meta-box ${key}`}">
    <p class="l">${opts.keyDisplay || key} ${opts.readonly && html`<span>· readonly</span>`}</p>
    ${children}
    ${errors(sch, key)?.map(err => html`<p class="err">${err}</p>`)}
  </label>
  `

const textInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <textarea name="${name(sch, key)}" maxlength="${opts.maxlength}" minlength="${opts.minlength}" ?readonly="${opts.readonly}" rows="1" spellcheck="false" class="${errors(sch, key) && "invalid"}" oninput="${autoResize}">${sch[key] || opts.value}</textarea>
  `, opts)

const numberInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="number" name="${name(sch, key)}" inputmode="decimal" step="any" min="${opts.min}" max="${opts.max}" value="${sch[key] || opts.value}" ?readonly="${opts.readonly}" class="${errors(sch, key) && "invalid"}">
  `, opts)

const integerInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="number" name="${name(sch, key)}" inputmode="numeric" pattern="[0-9]*" min="${opts.min}" max="${opts.max}" value="${sch[key] || opts.value}" ?readonly="${opts.readonly}" class="${errors(sch, key) && "invalid"}">
  `, opts)

const boolInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="checkbox" name="${name(sch, key)}" ?disabled="${opts.readonly}" ?checked="${sch[key] || opts.value}">
  `, opts)

const enumInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <select name="${name(sch, key)}" ?disabled="${opts.readonly}">
      ${(opts.collection).map(([v, t]) => html`<option value="${v}" ?selected="${(sch[key] || opts.selected) == v}">${t}</option>`)}
    </select>
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

const name = (sch, key) => key

const renderTypeMeta = (sch) => {
  let htmls
  switch (true) {
    case sch.type == T.RECORD: htmls = [
      integerInput(sch, "min", { keyDisplay: "Min Properties", value: Object.keys(sch.fields).length, readonly: true }),
      integerInput(sch, "max", { keyDisplay: "Max Properties", value: Object.keys(sch.fields).length, readonly: true })
    ]
      break
    case sch.type == T.LIST: htmls = [
      integerInput(sch, "min", { keyDisplay: "Min Items", min: 1, value: 1 }),
      integerInput(sch, "max", { keyDisplay: "Max Items", min: 1 }),
      boolInput(sch, "unique", { keyDisplay: "Item uniqueness" })
    ]
      break
    case sch.type == T.TUPLE: htmls = [
      integerInput(sch, "min", { keyDisplay: "Min Items", value: sch.schs.length, readonly: true }),
      integerInput(sch, "max", { keyDisplay: "Max Items", value: sch.max || sch.schs.length })
    ]
      break
    case sch.type == T.STRING: htmls = [
      integerInput(sch, "min", { keyDisplay: "Min Length", min: 0 }),
      integerInput(sch, "max", { keyDisplay: "Max Length", min: 0 }),
      textInput(sch, "pattern", { keyDisplay: "Pattern", maxlength: 256 })
    ]
      break
    case sch.type == T.NUMBER: htmls = [
      numberInput(sch, "min", { keyDisplay: "Min" }),
      numberInput(sch, "max", { keyDisplay: "Max" }),
      numberInput(sch, "multipleOf", { keyDisplay: "Multiple of", min: 1 })
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

  if (sch._meta.parent.type == T.RECORD && sch._meta.parent._box != "file")
    htmls.push(boolInput(sch, "required", { keyDisplay: "Required" }))

  return htmls
}

const examples = (sch) =>
  Meta.examples(sch).map((example, i) =>
    labelA("examples", html`<pre style="padding: 0 .5rem;"><code>${JSON.stringify(example, null, '  ')}</code></pre>`, { keyDisplay: `Example ${i}` }))

const errors = (sch, key) => sch.errors && sch.errors[key]
