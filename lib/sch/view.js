import { render, html } from "uhtml"
import * as T from "./type.js"
import { jEQ, autoResize } from "../utils.js"

export { renderMeta } from "./view/meta.js"
export const renderRoot = (el, root, opts = {}) => {
  try {
    let ui = { level: 1, tab: 0, models: root.order.reduce((acc, m) => { acc[root.fields[m].$anchor] = m; return acc }, {}), rootBox: root._box }

    viewMain(el, {
      sch: root,
      ui: Object.assign(ui, opts.ui),
      path: root.path || "", key: root.key, parent: { type: root.type, _box: root._box }
    })
  }
  catch (e) { console.log(e) }
}

export const viewMain = (el, assigns) =>
  render(document.querySelector(el), html`
  <theme>
    <ul role="tree" aria-multiselectable="true" class="text-sm" tabindex="-1">
      ${viewModel(assigns)}
    </ul>
  </theme>
  ${null && debug(assigns)}
`)

const debug = (assigns) =>
  html`
<section style="width: 50%">
  <pre><code>${JSON.stringify(assigns, null, '  ')}</code></pre>
</section>`

const viewModel = (assigns) => {
  switch (true) {
    case assigns.sch._box == assigns.ui.rootBox: return viewRootItem(assigns)
    case T.CONTAINER_TYPES.includes(assigns.sch.type): return viewFolder(assigns)
    default: return viewFile(assigns)
  }
}

const viewRootItem = (assigns) =>
  html.for(assigns.sch, assigns.sch.$anchor)`
  <li id="${assigns.path}" .key="${assigns.key}" .index="${0}" aria-posinset="${1}" class="root-item" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
    <dfn class="h">
      ${wordBreakHtml(assigns.key)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
      ${viewItself(assigns)}
    </ul>
  </li>`

const viewFolder = (assigns) =>
  html.for(assigns.sch, assigns.sch.$anchor)`
  <li id="${assigns.path}" .key="${assigns.key}" .index="${assigns.ui.index}" aria-posinset="${assigns.ui.index + 1}" class="folder" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
    <dfn class="h">
      ${viewKey(Object.assign(assigns, { key: wordBreakHtml(assigns.key) }))}
      ${viewType(assigns)}
      ${viewMeta(assigns)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
      ${viewItself(assigns)}
    </ul>
  </li>`

const viewFile = (assigns) =>
  html.for(assigns.sch, assigns.sch.$anchor)`
  <li id="${assigns.path}" .key="${assigns.key}" .index="${assigns.ui.index}" aria-posinset="${assigns.ui.index + 1}" class="file" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
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

const viewKeyed = (assigns) =>
  assigns.sch.order.map((k, i) =>
    viewModel({
      key: k,
      sch: assigns.sch.fields[k],
      parent: { type: assigns.sch.type, path: assigns.path, _box: assigns.sch._box },
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i },
      path: `${assigns.path}[${k}]`
    })
  )

const viewIndexed = (assigns) =>
  assigns.sch.schs.map((sch, i) =>
    viewModel({
      key: i,
      sch: assigns.sch.schs[i],
      parent: { type: assigns.sch.type, path: assigns.path, _box: assigns.sch._box },
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i },
      path: `${assigns.path}[][${i}]`
    })
  )

const viewSingled = (assigns) =>
  viewModel({
    key: 0,
    sch: assigns.sch.sch,
    parent: { type: assigns.sch.type, path: assigns.path, _box: assigns.sch._box },
    ui: { ...assigns.ui, level: assigns.ui.level + 1, index: 0 },
    path: `${assigns.path}[][${0}]`
  })

const viewNonKeyed = (assigns) =>
  assigns.sch.schs.map((sch, i) =>
    viewModel({
      key: "",
      sch: assigns.sch.schs[i],
      parent: { type: assigns.sch.type, path: assigns.path, _box: assigns.sch._box },
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i },
      path: `${assigns.path}[][${i}]`
    })
  )

const indent = (assigns) => `padding-left: ${((assigns.ui.level - 1) * 1.25) + assigns.ui.tab}rem`
const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="256" rows="1" autofocus
  data-parent-path="${parentPath}"
  oninput="${autoResize}"
  >${content}</textarea>`


const viewKey = (assigns) =>
  assigns.parent._box == assigns.ui.rootBox ? viewKeyRoot(assigns) : viewKeyNonRoot(assigns)

const viewKeyRoot = (assigns) =>
  html`
  <span class="def" style="${indent(assigns)}">
    ${modelTypeText(assigns.sch, assigns.ui)}
  </span>
  <span class="k">${editableKey(assigns)}</span>
  <span class="s">=</span>
  `

const viewKeyNonRoot = (assigns) => {
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
    textInput("key-edit", assigns.parent.path, assigns.key) :
    html`${assigns.key}`

const viewType = (assigns) =>
  assigns.parent._box == assigns.ui.rootBox ? viewTypeRoot(assigns) : viewTypeNonRoot(assigns)
const viewTypeRoot = (assigns) => {
  if (assigns.ui.viewTypeRoot) return assigns.ui.viewTypeRoot(assigns)
  else return html`<span class="t">${editableType(assigns)}</span>`
}
const viewTypeNonRoot = (assigns) =>
  html`<span class="t">${editableType(assigns)}</span>`
const editableType = (assigns) =>
  (assigns.sch.uiMode == "editType") ?
    textInput("type-edit", assigns.parent.path, assigns.sch.type) :
    html`${typeText(assigns.sch, assigns.ui)}`

const typeText = (sch, ui) => {
  let text
  switch (true) {
    case sch.type == T.RECORD && jEQ(sch.fields, {}): text = "{ any }"; break
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
    case sch.type == T.REF && !!ui.models[sch.$ref]: text = html`<span class="ref">${sch._text = ui.models[sch.$ref]}</span>`; break
    case sch.type == T.REF: text = html`<span class="ref notfound" title="Ref type">${`${sch._text} (#404)`}</span>`; break
    case sch.type == T.VALUE: text = html`<span class="value" title="Value type">${JSON.stringify(sch.const)}</span>`; break
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
  let htmls
  switch (true) {
    case (assigns.parent.type == T.RECORD && assigns.sch.required):
      htmls = [html`<span class="m"> · required</span>`]
      break
    default:
      htmls = []
  }
  return htmls
}