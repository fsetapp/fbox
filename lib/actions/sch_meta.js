import * as Meta from "../pkgs/model/meta.js"
import * as Sch from "../sch.js"
import { readable } from "../utils.js"

export const edit = ({ store, scope, e }) => {
  const header = e.target.closest("[data-path]")
  const sch = Sch.update(store, header.dataset.path, (a, m) => readable(a, "uiMode", "edit"))
  store.renderSchMeta()

  const form = scope.querySelector(`[data-path=${CSS.escape(header.dataset.path)}]`)
  form.onsubmit = e => e.preventDefault()
}
export const save = ({ store, e }) => {
  const form = e.target.closest("form")
  const sch = Sch.update(store, form.dataset.path, (a, m) => readable(a, "uiMode", "saved"))
  store.renderSchMeta()

  form.dispatchEvent(new CustomEvent("sch-update", { detail: { sch }, bubbles: true }))
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
      path: form.dataset.path,
      file: e.target.closest("[data-file]").file,
      attrs: post
    }

    let { path, attrs, file } = detail
    let sch = Sch.update(file, path, (a, m) => Meta.save(a, attrs))

    if (sch) {
      if (file.render) file.render()
      if (file.renderSchMeta) file.renderSchMeta()
    }
  }
}
