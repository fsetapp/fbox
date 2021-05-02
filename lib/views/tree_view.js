import { render, html } from "uhtml"
import * as T from "../sch/type.js"
import * as Diff from "../sch/diff.js"
import { jEQ, autoResize } from "../utils.js"

export { renderMeta } from "./sch_meta_view.js"
export const renderRoot = (el, root, opts = {}) => {
  try {
    let ui = { level: 1, tab: opts.ui?.tab || 0, models: root._models || {}, schMetas: root.schMetas, rootKey: root.key, taggedLevel: root.taggedLevel }
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
  render(document.querySelector(el), html`
  <ul role="tree" aria-multiselectable="true" class="${`${assigns.ui.lineClass || ''} text-sm`}" aria-labelledby="${assigns.ui.taggedLevel[assigns.ui.level] + "_tree"}">
    ${viewModel(assigns)}
  </ul>
`)

const diffdata = (_diff) => {
  if (!_diff) return ""
  for (let k of Object.keys(_diff))
    switch (k) {
      case Diff.NEW: return "N"
      case Diff.REMOVED: return "R"
      case Diff.MOVED: return "M"
      case Diff.NEW_ORDER: return ""
      case Diff.NEW_KEY: return "C"
      case Diff.NEW_TYPE: return "C"
      case Diff.ENTRY_MARKED: return "C"
    }
}

const viewModel = (assigns) => {
  switch (true) {
    case assigns.ui.level == assigns.ui.rootLevel:
      return viewRootItem(assigns)

    case [T.LIST].includes(assigns.sch.type):
      Object.assign(assigns.ui, { expanded: false })
      return viewFolder(assigns)

    case T.CONTAINER_TYPES.includes(assigns.sch.type):
      Object.assign(assigns.ui, { expanded: true })
      return viewFolder(assigns)

    default:
      return viewFile(assigns)
  }
}

const viewRootItem = (assigns) =>
  html.for(assigns.parent, assigns.path)`
  <li id="${assigns.path}" .dataset="${{ tag: assigns.ui.taggedLevel[assigns.ui.level] }}" .key="${assigns.key}" .index="${0}" aria-posinset="${1}" class="root-item" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    <dfn class="h" id="${assigns.ui.taggedLevel[assigns.ui.level] + "_tree"}">
      ${wordBreakHtml(assigns.key)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
      ${viewItself(assigns)}
    </ul>
  </li>`


const viewFolder = (assigns) =>
  html.for(assigns.parent, assigns.path)`
  <li id="${assigns.path}" .dataset="${{ tag: assigns.ui.taggedLevel[assigns.ui.level] }}" .key="${assigns.key}" .index="${assigns.ui.index}" aria-posinset="${assigns.ui.index + 1}" class="folder" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    <dfn class="h" .dataset="${{ diff: diffdata(assigns.sch._diff), groupSize: groupSize(assigns.sch) }}">
      ${viewKey(Object.assign(assigns, { key: wordBreakHtml(assigns.key) }))}
      ${viewType(assigns)}
      ${viewMeta(assigns)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
      ${viewItself(assigns)}
    </ul>
  </li>`

const viewFile = (assigns) =>
  html.for(assigns.parent, assigns.path)`
  <li id="${assigns.path}" .dataset="${{ tag: assigns.ui.taggedLevel[assigns.ui.level], diff: diffdata(assigns.sch._diff) }}" .key="${assigns.key}" .index="${assigns.ui.index}" aria-posinset="${assigns.ui.index + 1}" class="file" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
    ${viewKey(Object.assign(assigns, { key: wordBreakHtml(assigns.key) }))}
    ${viewType(assigns)}
    ${viewMeta(assigns)}
  </li>`

const viewItself = (assigns) => {
  if (assigns.ui.depthLimit && assigns.ui.level >= assigns.ui.depthLimit)
    return html``

  switch (true) {
    case [T.RECORD].includes(assigns.sch.type):
      return viewKeyed(assigns)

    case [T.TUPLE].includes(assigns.sch.type):
      return viewIndexed(assigns)

    case [T.LIST].includes(assigns.sch.type):
      return viewSingled(assigns)

    case [T.UNION].includes(assigns.sch.type):
      return viewNonKeyed(assigns)

    default:
      return html``
  }
}

const viewKeyed = (assigns) => {
  let acc = []
  for (let i = 0; i < assigns.sch.fields.length; i++)
    acc.push(viewModel({
      key: assigns.sch.fields[i].key,
      sch: assigns.sch.fields[i],
      parent: assigns.sch,
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i, parentPath: assigns.path },
      path: `${assigns.path}[${assigns.sch.fields[i].key}]`
    }))
  return acc
}

const viewIndexed = (assigns) => {
  let acc = []
  for (let i = 0; i < assigns.sch.schs.length; i++)
    acc.push(viewModel({
      key: i,
      sch: assigns.sch.schs[i],
      parent: assigns.sch,
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i, parentPath: assigns.path },
      path: `${assigns.path}[][${i}]`
    }))
  return acc
}

const viewSingled = (assigns) =>
  viewModel({
    key: 0,
    sch: assigns.sch.sch,
    parent: assigns.sch,
    ui: { ...assigns.ui, level: assigns.ui.level + 1, index: 0, parentPath: assigns.path },
    path: `${assigns.path}[][${0}]`
  })

const viewNonKeyed = (assigns) => {
  let acc = []
  for (let i = 0; i < assigns.sch.schs.length; i++)
    acc.push(viewModel({
      key: "",
      sch: assigns.sch.schs[i],
      parent: assigns.sch,
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i, parentPath: assigns.path },
      path: `${assigns.path}[][${i}]`
    }))
  return acc
}

const indent = (assigns) => `padding-left: ${((assigns.ui.level - 1) * 1.25) + assigns.ui.tab - 1}rem`
const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-path="${parentPath}"
  oninput="${autoResize}"
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
    case assigns.parent.type == T.UNION:
      return html`
      <span class="" style="${indent(assigns)}"></span>
      <span class="s">|</span>
      `
    case assigns.parent.type == T.LIST:
      return html`
      <span class="k" style="${indent(assigns)}"></span>
      <span class="s">└</span>
      `
    default:
      return html`
      <span class="k" style="${indent(assigns)}">
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
    case sch.type == T.VALUE:
      return JSON.stringify(sch.const)
    case sch.type == T.REF:
      return ui.models[sch.$ref].display
    default:
      return sch.type
  }
}
const typeText = (sch, ui) => {
  let text
  switch (true) {
    case sch.type == T.RECORD && sch.fields.length == 0: text = "{ any }"; break
    case sch.type == T.RECORD: text = `{ \xa0 }`; break
    case sch.type == T.LIST: text = html`[ ${typeText(sch.sch, ui)} ]`; break
    case sch.type == T.TUPLE: text = "( \xa0 )"; break
    case sch.type == T.STRING: text = "string"; break
    case sch.type == T.NUMBER: text = "number"; break
    case sch.type == T.INTEGER: text = "integer"; break
    case sch.type == T.BOOLEAN: text = "bool"; break
    case sch.type == T.NULL: text = "null"; break
    case sch.type == T.UNION: text = "||"; break
    case sch.type == T.ANY: text = "any"; break
    case sch.type == T.REF && !!ui.models[sch.$ref]: text = html`<span class="ref">${sch._text = typeTextPopulated(sch, ui)}</span>`; break
    case sch.type == T.REF: text = html`<span class="ref notfound" title="Ref type">${`${sch._text || "reference"} (#404)`}</span>`; break
    case sch.type == T.VALUE: text = html`<span class="value" title="Value type">${typeTextPopulated(sch, ui)}</span>`; break
    default: text = "please define what type ${sch} is"
  }

  if (ui.typeText) text = ui.typeText(sch, ui) || text
  return text
}

const wordBreakHtml = (word) => word
const keyedOrIndexed = (sch) => {
  switch (true) {
    case [T.RECORD].includes(sch.type): return "keyed"
    case [T.TUPLE, T.UNION].includes(sch.type): return "indexed"
    default: return "none"
  }
}
const groupSize = (sch) => {
  switch (true) {
    case [T.RECORD].includes(sch.type): return sch.fields.length
    case [T.TUPLE, T.UNION].includes(sch.type): return sch.schs.length
    case [T.LIST].includes(sch.type): return 1
    default: return 0
  }
}

const modelTypeText = (sch, ui) => {
  let text
  switch (true) {
    case sch.type == T.RECORD: text = "record"; break
    case sch.type == T.LIST: text = "list"; break
    case sch.type == T.TUPLE: text = "tuple"; break
    case sch.type == T.UNION: text = "union"; break
    default: text = "field"
  }

  if (ui.modelTypeText) text = ui.modelTypeText(sch, ui) || text
  return text
}

const viewMeta = (assigns) => {
  let metadata = assigns.ui.schMetas[assigns.sch.$anchor]
  let htmls
  switch (true) {
    case (assigns.parent.type == T.RECORD && metadata?.required):
      htmls = [html`<span class="m"> · required</span>`]
      break
    default:
      htmls = []
  }
  return htmls
}
