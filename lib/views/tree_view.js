import { render, html, nothing } from "lit-html"
import { repeat } from "lit-html/directives/repeat.js"
import { ifDefined } from "lit-html/directives/if-defined"

import * as T from "../sch/type.js"
import * as Diff from "../sch/diff.js"
import { autoResize, cursorEnd, readable, writable } from "../utils.js"

export { renderMeta } from "./sch_meta_view.js"

export const renderBlankTree = (el) =>
  render(html`<ul role="tree"></ul>`, document.querySelector(el))

export const renderRoot = (el, root, opts = {}) => {
  try {
    let ui = { level: 1, tab: opts.ui?.tab || 0, models: root._models || {}, taggedLevel: root.taggedLevel }
    ui.rootLevel = ui.level

    Object.assign(ui, opts.ui)
    if (opts.ui.lineClass) Object.assign(ui, { tab: opts.ui.tab + 2 })

    viewMain(el, {
      sch: root,
      ui: ui,
      path: root.path || "", key: root.key, parent: root
    })
  }
  catch (e) { console.log(e); }
}

const viewMain = (el, assigns) =>
  render(html`
  <ul role="tree" aria-multiselectable="true" class="${`${assigns.ui.lineClass || ''} text-sm`}" aria-labelledby="${tagdata(assigns.ui) + "_tree"}">
    ${viewModel(assigns)}
  </ul>
  `, document.querySelector(el))

const ifTagdata = (ui) => ifDefined(tagdata(ui))
const tagdata = (ui) => ui.taggedLevel[ui.level]

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

    case [T.LIST].includes(assigns.sch.t):
      if (assigns.sch.sch.hasOwnProperty("fields") ||
        assigns.sch.sch.hasOwnProperty("schs"))
        Object.assign(assigns.ui, { expanded: true })
      else
        Object.assign(assigns.ui, { expanded: false })

      return viewFolder(assigns)

    case assigns.sch.hasOwnProperty("fields") || assigns.sch.hasOwnProperty("schs"):
      Object.assign(assigns.ui, { expanded: true })
      return viewFolder(assigns)

    default:
      return viewFile(assigns)
  }
}

const viewRootItem = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="${ifTagdata(assigns.ui)}" .key="${assigns.key}" .index="${0}" .sch=${assigns.sch} aria-posinset="${1}" class="root-item" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    <dfn class="h" id="${tagdata(assigns.ui)}_tree">
      ${wordBreakHtml(assigns.key)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
      ${viewItself(assigns)}
    </ul>
  </li>`


const viewFolder = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="${ifTagdata(assigns.ui)}" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="folder" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    <dfn class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
      ${viewKey(Object.assign(assigns, { key: wordBreakHtml(assigns.key) }))}
      ${viewType(assigns)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
      ${viewItself(assigns)}
    </ul>
  </li>`

const viewFile = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="${ifTagdata(assigns.ui)}" data-diff="${diffdata(assigns.sch._diff)}" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="file" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
    ${viewKey(Object.assign(assigns, { key: wordBreakHtml(assigns.key) }))}
    ${viewType(assigns)}
  </li>`

const viewItself = (assigns) => {
  if (assigns.ui.depthLimit && assigns.ui.level >= assigns.ui.depthLimit)
    return nothing

  switch (true) {
    case [T.RECORD, T.TAGGED_UNION].includes(assigns.sch.t):
      return viewKeyed(assigns)

    case [T.TUPLE, T.DICT, T.E_RECORD].includes(assigns.sch.t):
      return viewIndexed(assigns)

    case [T.LIST].includes(assigns.sch.t):
      return viewSingled(assigns)

    case [T.UNION].includes(assigns.sch.t):
      return viewNonKeyed(assigns)

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
    case assigns.parent.t == T.UNION:
      return html`
      <span class="s" style="${indent(assigns, 1)}">|</span>
      `
    case assigns.parent.t == T.DICT && assigns.sch.$a == assigns.parent.schs[0].$a:
      return html`
      <span class="s" style="${indent(assigns)}">k</span>
      `
    case assigns.parent.t == T.DICT && assigns.sch.$a == assigns.parent.schs[1].$a:
      return html`
      <span class="s" style="${indent(assigns)}">v</span>
      `
    case assigns.parent.t == T.E_RECORD && assigns.sch.$a == assigns.parent.schs[0].$a:
      return html`
      <span class="s" style="${indent(assigns)}">extends</span>
      `
    case assigns.parent.t == T.E_RECORD && assigns.sch.$a == assigns.parent.schs[1].$a:
      return html`
      <span class="s" style="${indent(assigns)}">record</span>
      `
    case assigns.parent.t == T.LIST:
      return html`
      <span class="s" style="${indent(assigns)}">└</span>
      `
    case assigns.parent.t == T.RECORD:
      return html`
      <span class="k" style="${indent(assigns, 1)}" data-required="${!!assigns.sch.metadata?.required}" data-is-pattern="${!!assigns.sch.metadata?.isKeyPattern}">
        ${editableKey(assigns)}
      </span>
      <span class="s">:</span>
    `
    case assigns.parent.t == T.TAGGED_UNION:
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

const typeTextPopulated = (sch, ui) => {
  switch (true) {
    case sch.t == T.VALUE:
      return JSON.stringify(sch.v)
    case sch.t == T.REF:
      return ui.models[sch.$r]?.display
    default:
      return T.toStr(sch.t)
  }
}
const typeText = (sch, ui) => {
  let text
  let metadata = sch.metadata

  switch (true) {
    case sch.t == T.RECORD && sch.fields.length == 0: text = "{ any }"; break
    case sch.t == T.RECORD: text = `{ \xa0 }`; break
    case sch.t == T.E_RECORD: text = `e { }`; break
    case sch.t == T.LIST: text = html`[\xa0 ${typeText(sch.sch, ui)} \xa0]`; break
    case sch.t == T.TUPLE: text = "( \xa0 )"; break
    case sch.t == T.DICT: text = `dict`; break
    case sch.t == T.UNION: text = "||"; break
    case sch.t == T.TAGGED_UNION: text = `|| ${metadata?.tagname || sch.tagname}`; break

    case sch.t == T.STRING: text = "string"; break
    case sch.t == T.INT8: text = "int_8"; break
    case sch.t == T.INT16: text = "int_16"; break
    case sch.t == T.INT32: text = "int_32"; break
    case sch.t == T.UINT8: text = "uint_8"; break
    case sch.t == T.UINT16: text = "uint_16"; break
    case sch.t == T.UINT32: text = "uint_32"; break
    case sch.t == T.FLOAT32: text = "float_32"; break
    case sch.t == T.FLOAT64: text = "float_64"; break
    case sch.t == T.TIMESTAMP: text = "timestamp"; break
    case sch.t == T.BOOLEAN: text = "bool"; break
    case sch.t == T.NULL: text = "null"; break
    case sch.t == T.ANY: text = "any"; break
    case sch.t == T.REF && !!ui.models[sch.$r]:
      writable(sch, "_text", typeTextPopulated(sch, ui))
      text = html`<span class="ref">${sch._text}</span >`
      break
    case sch.t == T.REF && sch.$r == null: text = html`<span class="ref notfound" title="Ref type">nothing</span>`; break
    case sch.t == T.REF: text = html`<span class="ref notfound" title="Ref type">${`${sch._text || sch.$r} (#404)`}</span>`; break
    case sch.t == T.VALUE: text = html`<span class="value" title="Value type">${typeTextPopulated(sch, ui)}</span>`; break
    default: text = "# UNDEFINED_TYPE #"
  }

  if (ui.tText) text = ui.tText(sch, ui) || text
  return text
}

const wordBreakHtml = (word) => word
const keyedOrIndexed = (sch) => {
  switch (true) {
    case [T.RECORD, T.TAGGED_UNION].includes(sch.t): return "keyed"
    case [T.TUPLE, T.UNION, T.E_RECORD].includes(sch.t): return "indexed"
    default: return "none"
  }
}
const groupSize = (sch) => {
  switch (true) {
    case [T.RECORD, T.TAGGED_UNION].includes(sch.t): return sch.fields.length
    case [T.TUPLE, T.UNION, T.E_RECORD].includes(sch.t): return sch.schs.length
    case [T.LIST].includes(sch.t): return 1
    default: return 0
  }
}

const modelTypeText = (sch, ui) => {
  let text
  switch (true) {
    case sch.t == T.RECORD: text = "record"; break
    case sch.t == T.LIST: text = "list"; break
    case sch.t == T.TUPLE: text = "tuple"; break
    case sch.t == T.UNION: text = "union"; break
    case sch.t == T.TAGGED_UNION: text = "tagged union"; break
    case sch.t == T.E_RECORD: text = "extensible union"; break
    default: text = "field"
  }

  if (ui.modelTypeText) text = ui.modelTypeText(sch, ui) || text
  return text
}
