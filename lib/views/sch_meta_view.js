import { render, html, nothing } from "lit-html"
import { repeat } from 'lit-html/directives/repeat.js'
import { ifDefined } from 'lit-html/directives/if-defined'
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

customElements.define("autosize-text", class extends HTMLElement {
  static get observedAttributes() { return ["data-value"] }
  attributeChangedCallback(name, oldv, newv) { this.autosize(newv) }
  connectedCallback() { this.autosize.bind(this)() }
  autosize(newv) {
    for (let t of this.getElementsByTagName("textarea")) {
      newv ||= t.value
      if (newv) {
        t.value = newv
        autoResize({ target: t })
      }
    }
  }
})

export const renderBlankMeta = (container) =>
  render(repeat([{ $a: "nothing" }], sch => sch.$a, sch => nothing), document.querySelector(container))

export const renderMeta = (container, sch, root) => {
  try {
    let referrers = sch.referrers || []

    render(repeat([sch], sch => sch.$a, sch => html`
    <p class="meta-def">${slashedPath(root.key, sch._meta.path) || "-"}</p>
    <p>${T.toStr(sch.t)}</p>
    <form data-path="${sch._meta.path}" data-file="${root.key}" class="fbox">
      ${textInput(sch, "title", { keyDisplay: "Title" })}
      ${textInput(sch, "description", { keyDisplay: "Description" })}
      ${renderTypeMeta(sch)}
      ${enumInput(sch, "rw", { collection: [["r", "Readonly"], ["w", "Writeonly"], ["rw", "Read and Write"]], selected: value(sch, "rw", "rw"), keyDisplay: "Read / Write" })}
      ${valueInput(sch, "default", { keyDisplay: "Default", min: value(sch, "min"), max: value(sch, "max") })}
    </form>
    ${viewReferrers(referrers)}
  `), document.querySelector(container))
  }
  catch (e) { console.log(e); }
}

const viewReferrers = (referrers) => {
  if (referrers.length != 0) return html`
    <p>Referrers</p>
      <ul>
        ${referrers.map(r => html`<li>${r._meta.lpath.slice(1).map(a => a.key).join(" / ")}</li>`)}
      </ul>
    `
  else return nothing
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
    <p class="l">${opts.keyDisplay || key}</p>
    ${opts.title}
    ${children}
    ${errors(sch, key)?.map(err => html`<p class="err">${err}</p>`)}
  </label>
  `

const emailInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
  <input type="email" name="${name(sch, key)}" ?readonly="${opts.readonly}" class="${ifDefined(errors(sch, key) && "invalid")}">
  `, opts)

const textInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <autosize-text data-value="${value(sch, key) || ""}">
      <textarea name="${name(sch, key)}" maxlength="${ifDefined(zeroable(opts.maxlength))}" minlength="${ifDefined(zeroable(opts.minlength))}" ?readonly="${opts.readonly}" rows="1" spellcheck="false" class="${ifDefined(errors(sch, key) && "invalid")}" @input="${autoResize}">${opts.value || value(sch, key, "")}</textarea>
    </autosize-text>
  `, opts)

const numberInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="number" name="${name(sch, key)}" inputmode="decimal" step="${opts.step || "any"}" min="${ifDefined(zeroable(opts.min))}" max="${ifDefined(zeroable(opts.max))}" value="${ifDefined(zeroable(opts.value) || value(sch, key))}" ?readonly="${opts.readonly}" class="${ifDefined(errors(sch, key) && "invalid")}">
  `, opts)

const integerInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="number" name="${name(sch, key)}" inputmode="numeric" pattern="[0-9]*" min="${ifDefined(zeroable(opts.min))}" max="${ifDefined(zeroable(opts.max))}" value="${ifDefined(zeroable(opts.value) || value(sch, key))}" ?readonly="${opts.readonly}" class="${ifDefined(errors(sch, key) && "invalid")}">
  `, opts)

const boolInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="checkbox" name="${name(sch, key)}" ?disabled="${opts.readonly}" ?checked="${!!value(sch, key)}" .checked="${!!value(sch, key)}" .indeterminate="${opts.indeterminate}">
  `, opts)

const enumInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <select name="${name(sch, key)}" ?disabled="${opts.readonly}">
      ${(opts.collection).map(([v, t]) => html`<option value="${v}" ?selected="${(opts.selected || value(sch, key)) == v}">${t}</option>`)}
    </select>
  `, opts)

const comboboxInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="text" list="${sch._meta.level}${sch._meta.index}" name="${name(sch, key)}" ?readonly="${opts.readonly}" class="${ifDefined(errors(sch, key) && "invalid")}">
    <datalist id="${sch._meta.level}${sch._meta.index}">
      ${(opts.collection).map(([v, t]) => html`<option value="${v}">${t}</option>`)}
    </datalist>
  `, opts)

const valueInput = (sch, key, opts = {}) => {
  let attrs = T.attrs(sch.t) || {}
  switch (sch.t) {
    case T.BOOLEAN:
      let boolOpts = { collection: [["t", "True"], ["f", "False"], ["i", "Unset"]], selected: value(sch, key, "i") }
      return enumInput(sch, key, Object.assign(opts, boolOpts))
    case T.INTEGER:
    case T.INT8:
    case T.INT16:
    case T.INT32:
    case T.UINT8:
    case T.UINT16:
    case T.UINT32:
    case T.FLOAT32:
    case T.FLOAT64:
      return numberInput(sch, key, Object.assign(opts, attrs))
    case T.STRING:
      return textInput(sch, key, opts)
    default:
      return ``
  }
}

const schFormats = [
  "uuid",
  "date-time", "date", "time", "duration",
  "email", "idn-email", "hostname", "idn-hostname",
  "ipv4", "ipv6",
  "uri", "uri-reference", "iri", "iri-reference", "uri-template",
  "json-pointer", "relative-json-pointer"
]

const zeroable = (num) => num == 0 ? "0" : num
const name = (sch, key) => key
const value = (sch, key, default_) => (sch.metadata || {})[key] || default_
const positive = (val) => Math.max(0, val)

const renderTypeMeta = (sch) => {
  let htmls
  let attrs = T.attrs(sch.t) || {}

  switch (sch.t) {
    case T.RECORD:
      htmls = [
        boolInput(sch, "strict", { keyDisplay: "Strict" }),
      ]
      break
    case T.E_RECORD:
      htmls = [
        boolInput(sch, "strict", { keyDisplay: "Strict" })
      ]
      break
    case T.LIST:
      // "min" : 0 -------------------> sch.max
      // "max" : 0 --sch.min ---------> infinity
      htmls = [
        integerInput(sch, "min", { keyDisplay: "Min Items", min: 0, max: positive(value(sch, "max")) }),
        integerInput(sch, "max", { keyDisplay: "Max Items", min: positive(value(sch, "min", 0)) }),
        boolInput(sch, "unique", { keyDisplay: "Item uniqueness" })
      ]
      break
    case T.TUPLE: htmls = [
      integerInput(sch, "min", { keyDisplay: "Min Items", value: sch.schs.length, readonly: true }),
      integerInput(sch, "max", { keyDisplay: "Max Items", value: sch.schs.length, readonly: true })
    ]
      break
    case T.DICT: htmls = [
      integerInput(sch, "min", { keyDisplay: "Min Properties", min: 0, max: positive(value(sch, "max")) }),
      integerInput(sch, "max", { keyDisplay: "Max Properties", min: positive(value(sch, "min", 0)) })
    ]
      break
    case T.TAGGED_UNION: htmls = [
      textInput(sch, "tagname", { keyDisplay: "Tag name", value: sch.tagname })
    ]
      break
    case T.STRING:
      // "min" : 0 -------------------> sch.max
      // "max" : 0 --sch.min ---------> infinity
      htmls = [
        integerInput(sch, "min", { keyDisplay: "Min Length", min: 0, max: positive(value(sch, "max")) }),
        integerInput(sch, "max", { keyDisplay: "Max Length", min: positive(value(sch, "min", 0)) }),
        textInput(sch, "pattern", { keyDisplay: "String Pattern", maxlength: 256 }),
        comboboxInput(sch, "format", { collection: schFormats.map(a => [a, a]), keyDisplay: "Format" })
      ]
      break
    case T.INTEGER:
      htmls = [
        numberInput(sch, "min", { keyDisplay: "Min", max: value(sch, "max") }),
        numberInput(sch, "max", { keyDisplay: "Max", min: value(sch, "min") }),
        numberInput(sch, "multipleOf", { keyDisplay: "Multiple of", min: 1, max: Math.min(value(sch, "max", attrs.max), attrs.max) })
      ]
      break
    case T.INT8:
    case T.INT16:
    case T.INT32:
    case T.UINT8:
    case T.UINT16:
    case T.UINT32:
      htmls = [
        numberInput(sch, "multipleOf", { keyDisplay: "Multiple of", min: 1, max: Math.min(value(sch, "max", attrs.max), attrs.max) }),
        textInput(sch, "format", { keyDisplay: "Format" })
      ]
      break
    case T.FLOAT32:
    case T.FLOAT64: htmls = [
      numberInput(sch, "min", { keyDisplay: "Min", max: value(sch, "max") }),
      numberInput(sch, "max", { keyDisplay: "Max", min: value(sch, "min") }),
      textInput(sch, "format", { keyDisplay: "Format" })
    ]
      break
    case T.BOOLEAN: htmls = []
    case T.NULL: htmls = []
      break
    case T.UNION:
      if (sch.schs.reduce((acc, a) => a.t == T.VALUE && acc, true))
        htmls = [
          boolInput(sch, "asUnion", { keyDisplay: "As Union" })
        ]
      else
        htmls = []
      break
    case T.ANY: htmls = []
    case T.REF: htmls = []
    case T.VALUE: htmls = []
    default: htmls = []
  }

  let hasParentRecord = sch._meta.parent.t == T.RECORD
  let belowFmodelLevel = sch._meta.level > 2

  if (hasParentRecord && belowFmodelLevel) {
    switch (true) {
      case !value(sch, "isKeyPattern") && !value(sch, "required"):
        htmls.push(boolInput(sch, "required", { keyDisplay: "Required" }))
        // htmls.push(boolInput(sch, "isKeyPattern", { keyDisplay: "Pattern Key" }))
        break
      case value(sch, "isKeyPattern"):
        htmls.push(boolInput(sch, "required", { keyDisplay: "Required", readonly: true }))
        // htmls.push(boolInput(sch, "isKeyPattern", { keyDisplay: "Pattern Key" }))
        break
      case value(sch, "required"):
        htmls.push(boolInput(sch, "required", { keyDisplay: "Required" }))
        // htmls.push(boolInput(sch, "isKeyPattern", { keyDisplay: "Pattern Key", readonly: true }))
        break
    }
  }

  return htmls
}

// const examples = (sch) =>
//   Meta.examples(sch).map((example, i) =>
//     labelA("examples", html`<pre style="padding: 0 .5rem;"><code>${JSON.stringify(example, null, '  ')}</code></pre>`, { keyDisplay: `Example ${i}` }))

const errors = (sch, key) => sch.errors && sch.errors[key]
