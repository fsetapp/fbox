import { render, html, nothing } from "lit-html"
import { repeat } from "lit-html/directives/repeat.js"
import { ifDefined } from "lit-html/directives/if-defined.js"

import * as Html from "../pkgs/html.js"
import * as Diff from "../sch/diff.js"
import { autoWidth, cursorEnd } from "../utils.js"

export const renderBlankTree = (el) =>
  render(html`<ol role="tree"></ol>`, document.querySelector(el))

export const renderRoot = (el, root, opts = {}) => {
  try {
    let ui = {
      level: 1, tab: opts.ui?.tab || 0, models: root._models || {},
      structSheet: root.structSheet
    }
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
  <ol role="tree" aria-multiselectable="true" class="${`${assigns.ui.lineClass || ''} text-sm`}" aria-labelledby="${tagdata(assigns.sch.tag) + "_tree"}">
    ${viewModel(assigns)}
  </ol>
  `, document.querySelector(el))

const ifTagdata = (tag) => ifDefined(tagdata(tag))
const tagdata = (tag) => tag

const errordata = ({ m, t, terror }, { structSheet }) =>
  ifDefined(terror?.map(e => structSheet[m].toStr(t)).join(","))

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
      ${assigns.key}
    </dfn>
    <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
      ${viewItself(assigns)}
    </ol>
  </li>`

const viewNode = (assigns) =>
  html`
  <li id="${assigns.path}" data-diff="${diffdata(assigns.sch._diff)}" data-sig="${errordata(assigns.sch, assigns.ui)}" data-tag="${ifTagdata(assigns.sch.tag)}" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="node" role="treeitem" data-level-kind="${assigns.ui.level % 2 == 0 ? 'even' : 'odd'}" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    ${editableType(assigns)}
    <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group">
      ${viewItself(assigns)}
    </ol>
  </li>`

const viewLeaf = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="${ifTagdata(assigns.sch.tag)}" data-sig="${errordata(assigns.sch, assigns.ui)}" data-diff="${diffdata(assigns.sch._diff)}" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="leaf" role="treeitem" data-level-kind="${assigns.ui.level % 2 == 0 ? 'even' : 'odd'}" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
    ${editableType(assigns)}
  </li>`

const viewItself = (assigns) => {
  if (assigns.ui.depthLimit && assigns.ui.level >= assigns.ui.depthLimit)
    return nothing

  switch (true) {
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
  @input="${autoWidth}"
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
  <span class="s">=</span>
  `

const viewKeyNonTop = (assigns) => {
  switch (true) {
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

const editableType = (assigns) => {
  let textNode = Html.text()

  switch (true) {
    case assigns.sch.uiMode == "editType":
      return html`<combo-box class="t" id="type_search" list="typesearch">
        ${textInput("type-edit", assigns.ui.parentPath, typeTextPopulated(assigns.sch, assigns.ui))}
      </combo-box>`

    case assigns.sch.t == textNode.t:
      return html`
        <span class="t">t</span>
        <span class="txt">${editableKey(assigns)}</span>
      `

    default:
      return html`<span class="t">${typeText(assigns.sch, assigns.ui)}</span>`
  }
}

const typeTextPopulated = (sch, ui) => typeText(sch, ui)
const typeText = (sch, ui) => {
  const { toStr } = ui.structSheet[sch.m]
  return toStr(sch.t)
}

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
  if (ui.modelTypeText) text = ui.modelTypeText(sch, ui) || text
  return text
}
