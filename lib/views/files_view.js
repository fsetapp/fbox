import { render, html, nothing } from "lit-html"
import { repeat } from "lit-html/directives/repeat.js"

import * as Proj from "../pkgs/proj.js"

import * as Diff from "../sch/diff.js"
import { autoResize, cursorEnd } from "../utils.js"
import * as TypeView from "./_type_view.js"

export const view = (el, root, opts = {}) => {
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
  <ul role="tree" aria-multiselectable="true" class="${`${assigns.ui.lineClass || ''} text-sm`}" aria-labelledby="project_tree">
    ${viewModel(assigns)}
  </ul>
  `, document.querySelector(el))

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

    case [Proj.FOLDER, Proj.PROJECT].includes(assigns.sch.t):
      return viewFolder(assigns)

    case assigns.sch.t == Proj.KEEP_EXT:
      return nothing

    case assigns.sch.tag == Proj.FILE_TAG:
      return viewFile(assigns)

    default:
      return nothing
  }
}

const viewRootItem = (assigns) =>
  html`
  <li id="${assigns.path}" .key="${assigns.key}" .index="${0}" .sch=${assigns.sch} aria-posinset="${1}" class="root-item" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    <dfn class="h" id="project_tree">
      ${wordBreakHtml(assigns.key)}
      <div>
        <button data-cmd="add-folder" .defaultSch="${0}">+folder</button>
        <button data-cmd="add-file" .defaultSch="${1}">+model</button>
        <button data-cmd="add-file" .defaultSch="${2}">+data</button>
        <button data-cmd="add-file" .defaultSch="${3}">+html</button>
        <button data-cmd="add-file" .defaultSch="${4}">+json</button>
      </div>
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
      ${viewItself(assigns)}
    </ul>
  </li>`

const viewFolder = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="folder" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="node" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    <dfn class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
      ${viewKey(Object.assign(assigns, { key: wordBreakHtml(assigns.key) }))}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
      ${viewItself(assigns)}
    </ul>
  </li>`

const viewFile = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="file" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="node" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    <dfn class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
      ${viewKey(Object.assign(assigns, { key: wordBreakHtml(assigns.key) }))}
      ${viewType(assigns)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
    </ul>
  </li>`

const viewItself = (assigns) => {
  if (assigns.ui.depthLimit && assigns.ui.level >= assigns.ui.depthLimit)
    return nothing

  return viewKeyed(assigns, fields => fields.sort((a, b) => {
    switch (true) {
      case a.tag == b.tag: return a.key < b.key ? -1 : 1
      case a.tag == Proj.FOLDER_TAG && b.tag == Proj.FILE_TAG: return -1
      case a.tag == Proj.FILE_TAG && b.tag == Proj.FOLDER_TAG: return 1
    }
  }))
}

const viewKeyed = (assigns, f = a => a) =>
  repeat(f(assigns.sch.fields), (sch) => sch.$a, (sch, i) =>
    viewModel({
      key: sch.key,
      sch: sch,
      parent: assigns.sch,
      ui: { ...assigns.ui, level: assigns.ui.level + 1, index: i, parentPath: assigns.path },
      path: `${assigns.path}[${sch.key}]`
    })
  )

const indent = (assigns, extra = 0) => `padding-left: ${((assigns.ui.level - 1) * 2) + assigns.ui.tab - 1 + extra}ch`
const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-path="${parentPath}"
  data-newline="false"
  @input="${autoResize}"
  @focus="${cursorEnd}"
  .value=${content}
  ></textarea>`


const viewKey = (assigns) =>
  assigns.ui.level == assigns.ui.rootLevel + 1 ? viewKeyTop(assigns) : viewKeyNonTop(assigns)

const viewKeyTop = (assigns) =>
  html`
  <span class="def" style="${indent(assigns)}">
    ${modelTypeText(assigns.sch, assigns.ui)}
  </span>
  <span class="k">${editableKey(assigns)}</span>
  `

const viewKeyNonTop = (assigns) =>
  html`
  <span class="k" style="${indent(assigns, 1)}">
    ${editableKey(assigns)}
  </span>
  `
const editableKey = (assigns) =>
  (assigns.sch.uiMode == "editKey") ?
    textInput("key-edit", assigns.ui.parentPath, assigns.key) :
    html`${assigns.key}`

const viewType = (assigns) => viewTypeNonTop(assigns)
const viewTypeNonTop = (assigns) =>
  html`<span class="t">${editableType(assigns)}</span>`
const editableType = (assigns) =>
  (assigns.sch.uiMode == "editType") ?
    html`<combo-box id="type_search" list="typesearch">
      ${textInput("type-edit", assigns.ui.parentPath, typeTextPopulated(assigns.sch, assigns.ui))}
    </combo-box>` :
    html`${typeText(assigns.sch, assigns.ui)}`

const typeTextPopulated = (sch, ui) => TypeView.typeTextPopulated(sch, ui)
const typeText = (sch, ui) => {
  switch (true) {
    case sch.t == Proj.MODEL_EXT: return html`.sch`
    case sch.t == Proj.JSON_DATA_EXT: return html`.data`
    case sch.t == Proj.HTML_EXT: return html`.html`
    case sch.t == Proj.JSON_EXT: return html`.json`
  }
}
const wordBreakHtml = (word) => word
const keyedOrIndexed = (sch) => "keyed"
const groupSize = (sch) => sch.fields.length

const modelTypeText = (sch, ui) => {
  let text
  text = ""
  if (ui.modelTypeText) text = ui.modelTypeText(sch, ui) || text
  return text
}
