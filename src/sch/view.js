import { render, html } from "uhtml"
import * as T from "./type.js"

export const renderRoot = (sch) => {
  try {
    viewMain({
      sch: sch,
      ui: { level: 1, tab: 0, models: sch.order.reduce((acc, m) => { acc[sch.fields[m].$anchor] = m; return acc }, {}) },
      path: "", key: "root", parent: { type: sch.type, _box: sch._box }
    })
  }
  catch (e) { }
}

const viewMain = (assigns) =>
  render(document.querySelector("#fmodel"), html`
  <theme>
    <ul role="tree" aria-multiselectable="true" class="text-sm">
      ${viewModel(assigns)}
    </ul>
  </theme>
  ${null && debug(assigns)}
`)

const jEQ = (obj1, obj2) => JSON.stringify(obj1) == JSON.stringify(obj2)

const debug = (assigns) =>
  html`
<section style="width: 50%">
  <pre><code>${JSON.stringify(assigns, null, '  ')}</code></pre>
</section>`

const viewModel = (assigns) => {
  switch (true) {
    case assigns.sch._box == T.FMODEL_BOX: return viewFModels(assigns)
    case T.CONTAINER_TYPES.includes(assigns.sch.type): return viewFolder(assigns)
    default: return viewFile(assigns)
  }
}

const viewFModels = (assigns) =>
  html.for(assigns.sch, assigns.sch.$anchor)`
  <li id="${assigns.path}" .key="${assigns.key}" class="fmodels" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
      ${viewItself(assigns)}
    </ul>
  </li>`

const viewFolder = (assigns) =>
  html.for(assigns.sch, assigns.sch.$anchor)`
  <li id="${assigns.path}" .key="${assigns.key}" class="folder" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
    <dfn class="h">
      ${viewKey(Object.assign(assigns, { key: wordBreakHtml(assigns.key) }))}
      ${viewType(assigns)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
      ${viewItself(assigns)}
    </ul>
  </li>`

const viewFile = (assigns) =>
  html.for(assigns.sch, assigns.sch.$anchor)`
  <li id="${assigns.path}" .key="${assigns.key}" class="file" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
    ${viewKey(Object.assign(assigns, { key: wordBreakHtml(assigns.key) }))}
    ${viewType(assigns)}
  </li>`

const viewItself = (assigns) => {
  switch (true) {
    case [T.RECORD].includes(assigns.sch.type):
      return viewKeyed(assigns)
      break
    case [T.TUPLE].includes(assigns.sch.type):
      return viewIndexed(assigns)
      break
    case [T.LIST].includes(assigns.sch.type):
      return viewSingled(assigns)
      break
    case [T.UNION].includes(assigns.sch.type):
      return viewNonKeyed(assigns)
      break
    default:
      return html``
  }
}

const viewKeyed = (assigns) =>
  assigns.sch.order.map(k =>
    viewModel({
      key: k,
      sch: assigns.sch.fields[k],
      parent: { type: assigns.sch.type, path: assigns.path, _box: assigns.sch._box },
      ui: { ...assigns.ui, level: assigns.ui.level + 1 },
      path: `${assigns.path}[${k}]`
    })
  )

const viewIndexed = (assigns) =>
  assigns.sch.schs.map((sch, i) =>
    viewModel({
      key: i,
      sch: assigns.sch.schs[i],
      parent: { type: assigns.sch.type, path: assigns.path, _box: assigns.sch._box },
      ui: { ...assigns.ui, level: assigns.ui.level + 1 },
      path: `${assigns.path}[][${i}]`
    })
  )

const viewSingled = (assigns) =>
  viewModel({
    key: 0,
    sch: assigns.sch.sch,
    parent: { type: assigns.sch.type, path: assigns.path, _box: assigns.sch._box },
    ui: { ...assigns.ui, level: assigns.ui.level + 1 },
    path: `${assigns.path}[][${0}]`
  })

const viewNonKeyed = (assigns) =>
  assigns.sch.schs.map((sch, i) =>
    viewModel({
      key: "",
      sch: assigns.sch.schs[i],
      parent: { type: assigns.sch.type, path: assigns.path, _box: assigns.sch._box },
      ui: { ...assigns.ui, level: assigns.ui.level + 1 },
      path: `${assigns.path}[][${i}]`
    })
  )

const indent = (assigns) => `padding-left: ${((assigns.ui.level - 1) * 1.25) + assigns.ui.tab}rem`
const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="256" rows="1" autofocus
  data-parent-path="${parentPath}"
  oninput="${e => e.target.value = e.target.value.replace(/\n/g, "")}"
  >${content}</textarea>`


const viewKey = (assigns) =>
  assigns.parent._box == T.FMODEL_BOX ? viewKeyRoot(assigns) : viewKeyNonRoot(assigns)

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
      break
    case assigns.parent.type == T.LIST:
      return html`
      <span class="k" style="${indent(assigns)}"></span>
      <span class="s">└</span>
      `
      break
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
  (assigns.sch?.uiMode == "editKey") ?
    textInput("key-edit", assigns.parent.path, assigns.key) :
    html`${assigns.key}`

const viewType = (assigns) =>
  assigns.parent._box == T.FMODEL_BOX ? viewTypeRoot(assigns) : viewTypeNonRoot(assigns)
const viewTypeRoot = (assigns) =>
  html`<span class="t">${editableType(assigns)}</span>`
const viewTypeNonRoot = (assigns) =>
  html`<span class="t">${editableType(assigns)}</span>`
const editableType = (assigns) =>
  (assigns.sch?.uiMode == "editType") ?
    textInput("type-edit", assigns.parent.path, assigns.sch.type) :
    html`${typeText(assigns.sch, assigns.ui)}`

const typeText = (sch, ui) => {
  switch (true) {
    case sch.type == T.RECORD && jEQ(sch.fields, {}): return "{ any }"
    case sch.type == T.RECORD: return `{ \xa0 }`
    case sch.type == T.LIST: return html`[ ${typeText(sch.sch, ui)} ]`
    case sch.type == T.TUPLE: return "( \xa0 )"
    case sch.type == T.STRING: return "string"
    case sch.type == T.NUMBER: return "number"
    case sch.type == T.INTEGER: return "integer"
    case sch.type == T.BOOLEAN: return "bool"
    case sch.type == T.NULL: return "null"
    case sch.type == T.UNION: return "||"
    case sch.type == T.ANY: return "any"
    case sch.type == T.REF && !!ui.models[sch.$ref]: return html`<span class="ref">${sch._text = ui.models[sch.$ref]}</span>`
    case sch.type == T.REF: return html`<span class="ref notfound" title="Ref type">${`${sch._text} (#404)`}</span>`
    case sch.type == T.VALUE: return html`<span class="value" title="Value type">${JSON.stringify(sch.const)}</span>`
    default: return "please define what type ${sch} is"
  }
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
  switch (true) {
    case sch.type == T.RECORD: return "record"; break
    case sch.type == T.LIST: return "list"; break
    case sch.type == T.TUPLE: return "tuple"; break
    case sch.type == T.UNION: return "union"; break
    default: return "field"
  }
}
