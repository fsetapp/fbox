import { render, html, nothing } from "lit-html"
import { repeat } from "lit-html/directives/repeat.js"
import { ifDefined } from "lit-html/directives/if-defined"

import * as Diff from "../sch/diff.js"
import { autoResize, cursorEnd } from "../utils.js"
import * as J from "../pkgs/json.js"

export { renderMeta } from "./sch_meta_view.js"

export const renderBlankTree = (el) =>
  render(html`<ul role="tree"></ul>`, document.querySelector(el))

export const renderRoot = (el, root, opts = {}) => {
  try {
    let ui = { level: 1, tab: opts.ui?.tab || 0, models: root._models || {}, structSheet: root.structSheet }
    ui.rootLevel = ui.level

    Object.assign(ui, opts.ui)
    if (opts.ui.lineClass) Object.assign(ui, { tab: opts.ui.tab + 2 })

    viewMain(el, {
      sch: root,
      ui: ui,
      path: "", key: root.key, parent: root
    })
  }
  catch (e) { console.log(e); }
}

const viewMain = (el, assigns) =>
  render(html`
  <ul role="tree" aria-multiselectable="true" class="${`${assigns.ui.lineClass || ''} text-sm`}" aria-labelledby="${tagdata(assigns.sch.tag) + "_tree"}">
    ${viewModel(assigns)}
  </ul>
  `, document.querySelector(el))

const ifTagdata = (tag) => ifDefined(tagdata(tag))
const tagdata = (tag) => tag

const diffdata = (_diff) => {
  let diffchar

  if (!_diff) return ""
  for (let k of Object.keys(_diff))
    switch (k) {
      case Diff.NEW: diffchar = "N"; break
      case Diff.REMOVED: diffchar = "R"; break
      case Diff.MOVED: diffchar = "M"; break
      case Diff.NEW_ORDER: diffchar = "O"; break
      case Diff.NEW_KEY: diffchar = "C"; break
      case Diff.NEW_TYPE: diffchar = "C"; break
      case Diff.ENTRY_MARKED: diffchar = "C"; break
    }

  return diffchar || ""
}

const viewModel = (assigns) => {
  switch (true) {
    case assigns.ui.level == assigns.ui.rootLevel:
      Object.assign(assigns.ui, { expanded: true })
      return viewRootItem(assigns)

    case assigns.sch.hasOwnProperty("fields") || assigns.sch.hasOwnProperty("schs"):
      // if (assigns.ui.level < assigns.ui.rootLevel + 3)
      //   Object.assign(assigns.ui, { expanded: true })
      // else
      Object.assign(assigns.ui, { expanded: true })

      return viewNode(assigns)

    default:
      return viewLeaf(assigns)
  }
}

const viewRootItem = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="${ifTagdata(assigns.sch.tag)}" .key="${assigns.key}" .index="${0}" .sch=${assigns.sch} aria-posinset="${1}" class="root-item" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    <dfn class="h" id="${tagdata(assigns.sch.tag)}_tree">
      ${wordBreakHtml(assigns.key)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
      ${viewItself(assigns)}
    </ul>
  </li>`

const viewNode = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="${ifTagdata(assigns.sch.tag)}" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="node" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    <dfn class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
      ${viewKey(Object.assign(assigns, { key: wordBreakHtml(assigns.key) }))}
      ${viewType(assigns)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
      ${viewItself(assigns)}
    </ul>
  </li>`

const viewLeaf = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="${ifTagdata(assigns.sch.tag)}" data-diff="${diffdata(assigns.sch._diff)}" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="leaf" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
    ${viewKey(Object.assign(assigns, { key: wordBreakHtml(assigns.key) }))}
    ${viewType(assigns)}
  </li>`

const viewItself = (assigns) => {
  if (assigns.ui.depthLimit && assigns.ui.level >= assigns.ui.depthLimit)
    return nothing

  switch (true) {
    case assigns.sch.hasOwnProperty("fields"):
      return viewKeyed(assigns)

    case assigns.sch.hasOwnProperty("schs"):
      return viewNonKeyed(assigns)

    case assigns.sch.hasOwnProperty("sch"):
      return viewSingled(assigns)

    default:
      return nothing
  }
}

const viewKeyed = (assigns) =>
  repeat(assigns.sch.fields, (sch) => sch.$a, (sch, i) =>
    viewModel({
      key: sch.key,
      sch: sch,
      parent: assigns.sch,
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i, parentPath: assigns.path },
      path: `${assigns.path}[${sch.key}]`
    })
  )


const viewIndexed = (assigns) =>
  repeat(assigns.sch.schs, (sch) => sch.$a, (sch, i) =>
    viewModel({
      key: i,
      sch: sch,
      parent: assigns.sch,
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i, parentPath: assigns.path },
      path: `${assigns.path}[][${i}]`
    })
  )


const viewSingled = (assigns) =>
  repeat([assigns.sch.sch], (sch) => sch.$a, (sch, i) =>
    viewModel({
      key: i,
      sch: assigns.sch.sch,
      parent: assigns.sch,
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i, parentPath: assigns.path },
      path: `${assigns.path}[][${i}]`
    })
  )

const viewNonKeyed = (assigns) =>
  repeat(assigns.sch.schs, (sch) => sch.$a, (sch, i) =>
    viewModel({
      key: "",
      sch: sch,
      parent: assigns.sch,
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i, parentPath: assigns.path },
      path: `${assigns.path}[][${i}]`
    })
  )

const indent = (assigns, extra = 0) => `padding-left: ${((assigns.ui.level - 1) * 2) + assigns.ui.tab - 1 + extra}ch`
const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-path="${parentPath}"
  data-newline="false"
  @input="${autoResize}"
  @focus="${cursorEnd}"
  >${content}</textarea>`


const viewKey = (assigns) =>
  assigns.ui.level == assigns.ui.rootLevel + 1 ? viewKeyTop(assigns) : viewKeyNonTop(assigns)

const viewKeyTop = (assigns) =>
  html`
  <span class="k" >${editableKey(assigns)}</span>
  <span class="s">=</span>
  `

const viewKeyNonTop = (assigns) => {
  switch (true) {
    case assigns.parent.t == J.ARRAY && assigns.sch.t == J.OBJECT:
      return html`
      <span class="s">:</span>
      `
    case assigns.parent.t == J.ARRAY && assigns.sch.t == J.ARRAY:
      return html`
      <span class="s">[</span>
      `
    case assigns.parent.t == J.ARRAY:
      return nothing

    case assigns.parent.t == J.OBJECT:
      return html`
      <span class="k">${editableKey(assigns)}</span>
      <span class="s">${{ [J.OBJECT]: "", [J.ARRAY]: "[" }[assigns.sch.t] || ":"}</span>
      `
  }
}

const editableKey = (assigns) =>
  (assigns.sch.uiMode == "editKey") ?
    textInput("key-edit", assigns.ui.parentPath, assigns.key) :
    html`${assigns.key}`

const viewType = (assigns) =>
  assigns.ui.level == assigns.ui.rootLevel + 1 ? viewTypeTop(assigns) : viewTypeNonTop(assigns)
const viewTypeTop = (assigns) => {
  if (assigns.ui.viewTypeTop) return assigns.ui.viewTypeTop(assigns)
  else return editableType(assigns)
}
const viewTypeNonTop = (assigns) => editableType(assigns)
const editableType = (assigns) =>
  (assigns.sch.uiMode == "editType") ?
    html`<combo-box id="type_search" class="t" list="typesearch">
      ${textInput("type-edit", assigns.ui.parentPath, typeTextPopulated(assigns.sch, assigns.ui))}
    </combo-box>` :
    typeText(assigns.sch, assigns.ui)

const typeTextPopulated = (sch, ui) => {
  const { toStr } = ui.structSheet[sch.m]

  return sch.v || toStr(sch.t)
}
const typeText = (sch, ui) => {
  switch (sch.t) {
    case J.OBJECT: return html`<span class="t obj"></span>`
    case J.ARRAY: return html`<span class="t arr"></span>`
    case J.STRING: return html`<span class="t str">"${sch.v}"</span>`
    case J.NUMBER: return html`<span class="t num">${sch.v}</span>`
    case J.BOOLEAN: return html`<span class="t bool">${sch.v}</span>`
    case J.NIL: return html`<span class="t nil">null</span>`
  }
}

const wordBreakHtml = (word) => word
const keyedOrIndexed = (sch) => {
  switch (true) {
    case sch.hasOwnProperty("fields"): return "keyed"
    case sch.hasOwnProperty("schs"): return "indexed"
    default: return "none"
  }
}
const groupSize = (sch) => {
  switch (true) {
    case sch.hasOwnProperty("fields"): return sch.fields.length
    case sch.hasOwnProperty("schs"): return sch.schs.length
    case sch.hasOwnProperty("sch"): return 1
    default: return 0
  }
}

const modelTypeText = (sch, ui) => {
  let text = "field"

  if (ui.modelTypeText) text = ui.modelTypeText(sch, ui) || text
  return text
}
