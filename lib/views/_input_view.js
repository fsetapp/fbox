import { html } from "lit-html"
import { ifDefined } from 'lit-html/directives/if-defined.js'
import { autoResize } from "../utils.js"

const name = (sch, key) => key
const value = (sch, key, default_) => (sch.metadata || {})[key] || default_
const errors = (sch, key) => sch.errors && sch.errors[key]
const zeroable = (num) => ifDefined(num == 0 ? "0" : num)

const labelA = (sch, key, children, opts = {}) => html`
  <label class="${opts.readonly && `box-label ${key} readonly` || `box-label ${key}`}">
    <p class="l">${opts.keyDisplay || key}</p>
    ${opts.title}
    ${children}
    ${errors(sch, key)?.map(err => html`<p class="err">${err}</p>`)}
  </label>
  `

export const textInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <autosize-text data-value="${value(sch, key) || ""}">
      <textarea name="${name(sch, key)}" maxlength="${zeroable(opts.maxlength)}" minlength="${zeroable(opts.minlength)}" ?readonly="${opts.readonly}" rows="1" spellcheck="false" class="${ifDefined(errors(sch, key) && "invalid")}" @input="${autoResize}" .value=${opts.value || value(sch, key, "")}></textarea>
    </autosize-text>
  `, opts)
