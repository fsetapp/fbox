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
    <textarea name="${name(sch, key)}" maxlength="${zeroable(opts.maxlength)}" minlength="${zeroable(opts.minlength)}" ?readonly="${opts.readonly}" rows="1" spellcheck="false" class="${ifDefined(errors(sch, key) && "invalid")}" @input="${autoResize}" .value=${opts.value || value(sch, key, "")}></textarea>
  `, opts)

export const emailInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
  <input type="email" name="${name(sch, key)}" ?readonly="${opts.readonly}" class="${ifDefined(errors(sch, key) && "invalid")}">
  `, opts)

export const numberInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="number" name="${name(sch, key)}" inputmode="decimal" step="${opts.step || "any"}" min="${zeroable(opts.min)}" max="${zeroable(opts.max)}" value="${zeroable(opts.value || value(sch, key))}" ?readonly="${opts.readonly}" class="${ifDefined(errors(sch, key) && "invalid")}">
  `, opts)

export const integerInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="number" name="${name(sch, key)}" inputmode="numeric" pattern="[0-9]*" min="${zeroable(opts.min)}" max="${zeroable(opts.max)}" value="${zeroable(opts.value || value(sch, key))}" ?readonly="${opts.readonly}" class="${ifDefined(errors(sch, key) && "invalid")}">
  `, opts)

export const boolInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="checkbox" name="${name(sch, key)}" ?disabled="${opts.readonly}" ?checked="${!!value(sch, key)}" .checked="${!!value(sch, key)}" .indeterminate="${opts.indeterminate}">
  `, opts)

export const enumInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <select name="${name(sch, key)}" ?disabled="${opts.readonly}">
      ${(opts.collection).map(([v, t]) => html`<option value="${v}" ?selected="${(opts.selected || value(sch, key)) == v}">${t}</option>`)}
    </select>
  `, opts)

export const comboboxInput = (sch, key, opts = {}) =>
  labelA(sch, key, html`
    <input type="text" list="${sch._meta.level}${sch._meta.index}" name="${name(sch, key)}" ?readonly="${opts.readonly}" class="${ifDefined(errors(sch, key) && "invalid")}">
    <datalist id="${sch._meta.level}${sch._meta.index}">
      ${(opts.collection).map(([v, t]) => html`<option value="${v}">${t}</option>`)}
    </datalist>
  `, opts)
