import { render, html, nothing } from "lit-html"
import { repeat } from "lit-html/directives/repeat.js"

const nextKey = (assigns, sch, i) => `${assigns.path}[${sch.key}]`
const nextIndex = (assigns, sch, i) => `${assigns.path}[][${i}]`

const iterate = (collection, keyFn, pathFn, assigns) =>
  repeat(assigns.ui.itemsFn(collection), (sch) => sch.$a, (sch, i) =>
    assigns.ui.view({
      key: keyFn(sch, i),
      sch: sch,
      parent: assigns.sch,
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i, parentPath: assigns.path },
      path: pathFn(assigns, sch, i)
    }))

export const viewItself = (assigns, view, itemsFn = a => a) => {
  const { sch, ui } = assigns
  Object.assign(ui, { view, itemsFn })

  if (ui.depthLimit && ui.level >= ui.depthLimit)
    return nothing

  switch (true) {
    case !!sch.fields: return iterate(sch.fields, (sch, i) => sch.key, nextKey, assigns)
    case !!sch.schs: return iterate(sch.schs, (sch, i) => i, nextIndex, assigns)
    case !!sch.sch: return iterate([sch.sch], (sch, i) => i, nextIndex, assigns)
    default: return nothing
  }
}

export const roleTree = (el, root, view, opts = {}) => {
  try {
    let ui = Object.assign({
      rootLevel: 1,
      level: 1,
      tab: opts.ui?.tab || 0,
      models: root._models || {},
      structSheet: root.structSheet
    }, opts.ui)

    if (opts.ui.lineClass) ui.tab += 2

    let initAssigns = {
      key: root.key,
      sch: root,
      parent: root,
      ui: ui,
      path: ""
    }

    let tree = html`<ol role="tree" aria-multiselectable="true" class="${`${ui.lineClass || ''} text-sm`}" aria-label="${root.key + " body"}">${view(initAssigns)}</ol>`
    render(tree, document.querySelector(el))
  }
  catch (e) { console.log(e); }
}

export const keyedOrIndexed = (sch) => {
  switch (true) {
    case !!sch.fields: return "keyed"
    case !!sch.schs: return "indexed"
    default: return "none"
  }
}

export const groupSize = (sch) => {
  switch (true) {
    case !!sch.fields: return sch.fields.length
    case !!sch.schs: return sch.schs.length
    case !!sch.sch: return 1
    default: return 0
  }
}
