import * as Meta from "../pkgs/model/meta.js"
import * as Sch from "../sch.js"
import { readable } from "../utils.js"

export const edit = ({ e, scope, store, view }) => {
  const header = e.target.closest("[data-anchor]")
  let sch = header.sch

  readable(header.sch, "uiMode", "edit")
  view.renderSchMeta(sch)

  const form = scope.querySelector(`[data-anchor=${CSS.escape(header.dataset.anchor)}]`)
  form.onsubmit = e => e.preventDefault()
}
export const show = ({ e, scope, store, view }) => {
  const form = e.target.closest("form")
  let sch = form.sch

  readable(sch, "uiMode", "show")
  view.renderSchMeta(sch)

  scope.dispatchEvent(new CustomEvent("sch-update", { detail: { sch }, bubbles: true }))
}
export const inputChange = context => {
  const { e, view } = context

  if (e.target instanceof HTMLTextAreaElement ||
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLSelectElement) {
    let { sch } = change(context)
    if (!sch) return
    view.renderSchMeta?.(sch)
  }
}

export const formSubmit = context => {
  const { view } = context
  let { sch, isValid, file } = change(context)
  if (!sch) return

  file.render?.()
  if (isValid) show(context)
  else view.renderSchMeta?.(sch)
}

const change = context => {
  const { e, view } = context

  const form = e.target.closest("form")
  const inputs = form.elements

  const value = (input) => {
    if (["checkbox", "radio"].includes(input.type)) return input.checked
    else return input.value
  }

  let post = {}
  for (let i = 0; i < inputs.length; i++) {
    let val = value(inputs[i])
    if (!(inputs[i] instanceof HTMLTextAreaElement) && val == "") continue

    post[inputs[i].name] = val
  }

  let detail = {
    target: e.target,
    anchor: form.dataset.anchor,
    file: e.target.closest("[data-file]").file,
    attrs: post
  }

  let { anchor, attrs, file } = detail
  let isValid = false
  let sch = Sch.update(file, (a, m) => a.$a == anchor, (a, m) => {
    let metadata = structuredClone(a.metadata)
    Meta.save(a, attrs)

    if (Object.keys(a.errors).length == 0) isValid = true
    else a.metadata = metadata

    return a
  })

  return { sch, isValid, file }
}
