import { render, html, nothing } from "lit-html"
import * as T from "../sch/type.js"
import * as Meta from "../sch/meta.js"
import { autoResize } from "../utils.js"

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
        if (["checkbox", "radio"].includes(input.t)) return input.checked
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
    render(nothing, container)
    render(html`
    <p class="meta-def">${slashedPath(root.key, sch._meta.path) || "-"}</p>
    <p>${T.toStr(sch.t)}</span>
    <form data-path="${sch._meta.path}" data-file="${root.key}" class="fbox">
      ${textInput(sch, "title", { keyDisplay: "Title" })}
      ${textInput(sch, "description", { keyDisplay: "Description" })}
      ${renderTypeMeta(sch)}
      ${enumInput(sch, "rw", { collection: [["r", "Readonly"], ["w", "Writeonly"], ["rw", "Read and Write"]], selected: value(sch, "rw") || "rw", keyDisplay: "Read / Write" })}
      ${valueInput(sch, "default", { keyDisplay: "Default", min: value(sch, "min"), max: value(sch, "max") })}
    </form>
  `, container)
  }
  catch (e) { console.log(e); }
}

const slashedPath = (fileKey, path) => {
  path = path.substring(1, path.length - 1).split("][").filter(a => a != "")
  path.splice(0, 0, fileKey)

  let def = html`<span style="color: var(--meta-def-color);">${path[0]} :: ${path[1]}</span>`
  path = path.slice(2).flatMap(p => [html`<span style="margin: 0 .5rem;">/</span>`, document.createTextNode(p)])
  path.splice(0, 0, def)

  return path
}

const labelA = (sch, key, children, opts = {}) => html`
  <label class="${opts.readonly && `box-label ${key} readonly` || `box-label ${key}`}">
    <p class="l">${opts.keyDisplay || key} ${opts.readonly && html`<span>· readonly</span>`}</p>
    ${children}
    ${errors(sch, key)?.map(err => html`<p class="err">${err}</p>`)}
  </label>
  `

const textInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <autosize-textarea>
      <textarea name="${name(sch, key)}" maxlength="${opts.maxlength}" minlength="${opts.minlength}" ?readonly="${opts.readonly}" rows="1" spellcheck="false" class="${errors(sch, key) && "invalid"}" @input="${autoResize}">${opts.value || value(sch, key)}</textarea>
    </autosize-textarea>
  `, opts)

const numberInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="number" name="${name(sch, key)}" inputmode="decimal" step="${opts.step || "any"}" min="${opts.min}" max="${opts.max}" value="${opts.value || value(sch, key)}" ?readonly="${opts.readonly}" class="${errors(sch, key) && "invalid"}">
  `, opts)

const integerInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="number" name="${name(sch, key)}" inputmode="numeric" pattern="[0-9]*" min="${opts.min}" max="${opts.max}" value="${opts.value || value(sch, key)}" ?readonly="${opts.readonly}" class="${errors(sch, key) && "invalid"}">
  `, opts)

const boolInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="checkbox" name="${name(sch, key)}" ?disabled="${opts.readonly}" ?checked="${opts.value || value(sch, key)}">
  `, opts)

const enumInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <select name="${name(sch, key)}" ?disabled="${opts.readonly}">
      ${(opts.collection).map(([v, t]) => html`<option value="${v}" ?selected="${(opts.selected || value(sch, key)) == v}">${t}</option>`)}
    </select>
  `, opts)

const valueInput = (sch, key, opts = {}) => {
  switch (sch.t) {
    case T.BOOLEAN:
      return boolInput(sch, key, opts)
    case T.INT8:
    case T.INT16:
    case T.INT32:
    case T.UINT8:
    case T.UINT16:
    case T.UINT32:
    case T.FLOAT32:
    case T.FLOAT64:
      return numberInput(sch, key, opts)
    case T.STRING:
      return textInput(sch, key, opts)
    default:
      return ``
  }
}

const name = (sch, key) => key
const value = (sch, key) => (sch.metadata || {})[key]

const renderTypeMeta = (sch) => {
  let htmls
  switch (sch.t) {
    case T.RECORD:
      let minProp = 0
      for (let sch_ of sch.fields)
        if (value(sch_, "required")) minProp++

      htmls = [
        integerInput(sch, "min", { keyDisplay: "Min Properties", value: minProp, readonly: true }),
        integerInput(sch, "max", { keyDisplay: "Max Properties", value: sch.fields.length, min: Math.max(value(sch, "min") || 0, 0) })
      ]
      break
    case T.LIST: htmls = [
      integerInput(sch, "min", { keyDisplay: "Min Items", min: 1, value: 1, max: value(sch, "max") }),
      integerInput(sch, "max", { keyDisplay: "Max Items", min: value(sch, "min") }),
      boolInput(sch, "unique", { keyDisplay: "Item uniqueness" })
    ]
      break
    case T.TUPLE: htmls = [
      integerInput(sch, "min", { keyDisplay: "Min Items", value: sch.schs.length, readonly: true }),
      integerInput(sch, "max", { keyDisplay: "Max Items", value: value(sch, "max") || sch.schs.length })
    ]
      break
    case T.TAGGED_UNION: htmls = [
      textInput(sch, "tagname", { keyDisplay: "Tag name", value: sch.tagname })
    ]
      break
    case T.STRING: htmls = [
      integerInput(sch, "min", { keyDisplay: "Min Length", min: 0, max: value(sch, "max") }),
      integerInput(sch, "max", { keyDisplay: "Max Length", min: Math.max(0, value(sch, "min")) }),
      textInput(sch, "pattern", { keyDisplay: "Pattern", maxlength: 256 })
    ]
      break
    case T.INT8:
    case T.INT16:
    case T.INT32:
    case T.UINT8:
    case T.UINT16:
    case T.UINT32:
      htmls = [
        numberInput(sch, "min", { keyDisplay: "Min", min: sch.min, max: Math.min(value(sch, "max"), sch.max) }),
        numberInput(sch, "max", { keyDisplay: "Max", min: Math.max(value(sch, "min"), sch.min), max: sch.max }),
        numberInput(sch, "multipleOf", { keyDisplay: "Multiple of", min: 1, max: Math.min(value(sch, "max"), sch.max) })
      ]
      break
    case T.FLOAT32:
    case T.FLOAT64: htmls = [
      numberInput(sch, "min", { keyDisplay: "Min", max: value(sch, "max") }),
      numberInput(sch, "max", { keyDisplay: "Max", min: value(sch, "min") }),
      numberInput(sch, "multipleOf", { keyDisplay: "Multiple of", min: 1, max: value(sch, "max") })
    ]
      break
    case T.BOOLEAN: htmls = []
    case T.NULL: htmls = []
    case T.UNION: htmls = []
    case T.ANY: htmls = []
    case T.REF: htmls = []
    case T.VALUE: htmls = []
    default: htmls = []
  }

  let hasParentRecord = sch._meta.parent.t == T.RECORD
  let belowFmodelLevel = sch._meta.level > 2
  let isNotPatternKey = !sch.isKeyPattern

  if (hasParentRecord && belowFmodelLevel && isNotPatternKey)
    htmls.push(boolInput(sch, "required", { keyDisplay: "Required" }))

  return htmls
}

const examples = (sch) =>
  Meta.examples(sch).map((example, i) =>
    labelA("examples", html`<pre style="padding: 0 .5rem;"><code>${JSON.stringify(example, null, '  ')}</code></pre>`, { keyDisplay: `Example ${i}` }))

const errors = (sch, key) => sch.errors && sch.errors[key]
