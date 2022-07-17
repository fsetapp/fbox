import * as Meta from "../pkgs/model/meta.js"
import * as Sch from "../sch.js"
import { readable } from "../utils.js"

export const edit = ({ store, scope, e }) => {
  const header = e.target.closest("[data-anchor]")
  let sch = header.sch

  readable(header.sch, "uiMode", "edit")
  store.renderSchMeta(sch)

  const form = scope.querySelector(`[data-anchor=${CSS.escape(header.dataset.anchor)}]`)
  form.onsubmit = e => e.preventDefault()
}
export const save = ({ store, scope, e }) => {
  const form = e.target.closest("form")
  let sch = form.sch

  readable(sch, "uiMode", "saved")
  store.renderSchMeta(sch)

  scope.dispatchEvent(new CustomEvent("sch-update", { detail: { sch }, bubbles: true }))
}
export const update = ({ e }) => {
  if (e.target instanceof HTMLTextAreaElement ||
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLSelectElement) {

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
    let sch = Sch.update(file, (a, m) => a.$a == anchor, (a, m) => Meta.save(a, attrs))

    if (sch) {
      if (file.render) file.render()
      if (file.renderSchMeta) file.renderSchMeta(sch)
    }
  }
}
