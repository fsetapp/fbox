import { render, html, nothing } from "lit-html"
import { repeat } from "lit-html/directives/repeat.js"
import { ifDefined } from "lit-html/directives/if-defined"

import * as M from "../pkgs/model.js"
import * as Diff from "../sch/diff.js"
import { autoResize, cursorEnd, readable, writable } from "../utils.js"
import * as TypeView from "./_type_view.js"

export { renderMeta } from "./sch_meta_view.js"

export const renderBlankTree = (el) =>
  render(html`<ul role="tree"></ul>`, document.querySelector(el))

export const renderRoot = (el, root, opts = {}) => {
  try {
    let ui = { level: 1, tab: opts.ui?.tab || 0, models: root._models || {} }
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

    case [M.LIST].includes(assigns.sch.t):
      if (assigns.sch.sch.hasOwnProperty("fields") ||
        assigns.sch.sch.hasOwnProperty("schs"))
        Object.assign(assigns.ui, { expanded: true })
      else
        Object.assign(assigns.ui, { expanded: false })

      return viewNode(assigns)

    case assigns.sch.hasOwnProperty("fields") || assigns.sch.hasOwnProperty("schs"):
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
    case [M.UNION].includes(assigns.sch.t):
      return viewNonKeyed(assigns)

    case assigns.sch.hasOwnProperty("fields"):
      return viewKeyed(assigns)

    case assigns.sch.hasOwnProperty("schs"):
      return viewIndexed(assigns)

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
  <span class="def" style="${indent(assigns)}">
    ${modelTypeText(assigns.sch, assigns.ui)}
  </span>
  <span class="k">${editableKey(assigns)}</span>
  <span class="s">=</span>
  `

const viewKeyNonTop = (assigns) => {
  switch (true) {
    case assigns.parent.t == M.UNION:
      return html`
      <span class="s" style="${indent(assigns, 1)}">|</span>
      `
    case assigns.parent.t == M.DICT && assigns.sch.$a == assigns.parent.schs[0].$a:
      return html`
      <span class="s" style="${indent(assigns)}">k</span>
      `
    case assigns.parent.t == M.DICT && assigns.sch.$a == assigns.parent.schs[1].$a:
      return html`
      <span class="s" style="${indent(assigns)}">v</span>
      `
    case assigns.parent.t == M.E_RECORD && assigns.sch.$a == assigns.parent.schs[0].$a:
      return html`
      <span class="s" style="${indent(assigns)}">e</span>
      `
    case assigns.parent.t == M.E_RECORD && assigns.sch.$a == assigns.parent.schs[1].$a:
      return html`
      <span class="s" style="${indent(assigns)}">r</span>
      `
    case assigns.parent.t == M.LIST:
      return html`
      <span class="s" style="${indent(assigns)}">└</span>
      `
    case assigns.parent.t == M.RECORD:
      return html`
      <span class="k" style="${indent(assigns, 1)}" data-required="${!!assigns.sch.metadata?.required}" data-is-pattern="${!!assigns.sch.metadata?.isKeyPattern}">
        ${editableKey(assigns)}
      </span>
      <span class="s">:</span>
    `
    case assigns.parent.t == M.TAGGED_UNION:
      return html`
      <span class="s" style="${indent(assigns, 0.5)}">|</span>
      <span class="k tag">
        ${editableKey(assigns)}
      </span>
      <span class="s">·</span>
    `
    default:
      return html`
      <span class="k" style="${indent(assigns, 1)}">
        ${editableKey(assigns)}
      </span >
      <span class="s">:</span>
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
  else return html`<span class="t">${editableType(assigns)}</span>`
}
const viewTypeNonTop = (assigns) =>
  html`<span class="t">${editableType(assigns)}</span>`
const editableType = (assigns) =>
  (assigns.sch.uiMode == "editType") ?
    html`<combo-box id="type_search" list="typesearch">
      ${textInput("type-edit", assigns.ui.parentPath, typeTextPopulated(assigns.sch, assigns.ui))}
    </combo-box>` :
    html`${typeText(assigns.sch, assigns.ui)}`

const typeTextPopulated = (sch, ui) => TypeView.typeTextPopulated(sch, ui)
const typeText = (sch, ui) => TypeView.typeText(sch, ui)

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
  let text
  switch (true) {
    case sch.t == M.RECORD: text = "record"; break
    case sch.t == M.LIST: text = "list"; break
    case sch.t == M.TUPLE: text = "tuple"; break
    case sch.t == M.UNION: text = "union"; break
    case sch.t == M.TAGGED_UNION: text = "tagged union"; break
    case sch.t == M.E_RECORD: text = "extensible union"; break
    default: text = "field"
  }

  if (ui.modelTypeText) text = ui.modelTypeText(sch, ui) || text
  return text
}
