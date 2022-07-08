import * as Meta from "../pkgs/model/meta.js"
import * as Sch from "../sch.js"

export const update = ({ tree, store, e }) => {
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

    form.dispatchEvent(new CustomEvent("sch-update", { detail: detail, bubbles: true }))
  }
}
