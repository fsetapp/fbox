import { render, html, nothing } from "lit-html"
import { repeat } from "lit-html/directives/repeat.js"
import { ifDefined } from "lit-html/directives/if-defined.js"
import { diffdata, ifTagdata } from "./_diff_view.js"
import { writable } from "../utils.js"


const nextKey = (assigns, sch, i) => `${assigns.path}[${sch.key}]`
const nextIndex = (assigns, sch, i) => `${assigns.path}[][${i}]`

const errordata = ({ m, t, terror }, { structSheet }) =>
  ifDefined(terror?.map(e => structSheet[m].toStr[t]).join(","))

const iterate = (collection, keyFn, pathFn, assigns) =>
  repeat(assigns.ui.itemsFn(collection), (sch) => sch.$a, (sch, i) =>
    assigns.ui.view({
      key: keyFn(sch, i),
      sch: sch,
      parent: assigns.sch,
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i, parentPath: assigns.path, parentAssigns: assigns },
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

    writable(root, "_columns", root._columns || {})
    root._columns[initAssigns.sch.$a] = initAssigns
    ui._columns = root._columns
    const columns = Object.values(root._columns)
      .sort((columnAssignsA, columnAssignsB) => columnAssignsA.ui.level - columnAssignsB.ui.level)
      .map((columnAssigns, i) => {
        columnAssigns.ui.columnIndex = i + 1
        return columnAssigns
      })

    let tree = html`<ol role="tree" aria-multiselectable="true" class="${`${ui.lineClass || ''} text-sm`}" aria-label="${root.key + " body"}">
      ${repeat(columns, assigns => assigns.sch.$a, (assigns, i) => view(assigns))}
    </ol>`
    render(tree, document.querySelector(el))
  }
  catch (e) { console.log(e); }
}

export const treeItem = (assigns, itemView) => {
  const { sch, item, ui, key, path } = assigns
  return html`<li id="${path}" class="${item?.nodeclass}" .key="${key}" .index="${ui.index || 0}" .sch="${sch}" data-diff="${diffdata(sch._diff)}" data-tag="${ifTagdata(sch.tag)}" role="treeitem" aria-level="${ui.level}" aria-posinset="${(ui.index || 0) + 1}" aria-selected="false" tabindex="-1" aria-expanded="${ifDefined(item?.expanded)}">${itemView(assigns)}</li>`
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
