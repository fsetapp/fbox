import { render, html, nothing } from "lit-html"

import { autoResize, cursorEnd } from "../utils.js"
import * as J from "../pkgs/json.js"
import { viewItself, keyedOrIndexed, groupSize } from "./_iterator_view.js"
import { diffdata, ifTagdata, tagdata } from "./_diff_view.js"

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
    ${viewBody(assigns)}
  </ul>
  `, document.querySelector(el))

const viewBody = (assigns) => {
  switch (true) {
    case assigns.ui.level == assigns.ui.rootLevel:
      Object.assign(assigns.ui, { expanded: true })
      return viewRootNode(assigns)

    case assigns.sch.hasOwnProperty("fields") || assigns.sch.hasOwnProperty("schs"):
      if (assigns.ui.level < assigns.ui.rootLevel + 3)
        Object.assign(assigns.ui, { expanded: true })
      else
        Object.assign(assigns.ui, { expanded: false })

      return viewNode(assigns)

    default:
      return viewLeaf(assigns)
  }
}

const viewRootNode = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="${ifTagdata(assigns.sch.tag)}" .key="${assigns.key}" .index="${0}" .sch=${assigns.sch} aria-posinset="${1}" class="root-item" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    <dfn class="h" id="${tagdata(assigns.sch.tag)}_tree">
      ${wordBreakHtml(assigns.key)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
      ${viewItself(assigns, viewBody)}
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
      ${viewItself(assigns, viewBody)}
    </ul>
  </li>`

const viewLeaf = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="${ifTagdata(assigns.sch.tag)}" data-diff="${diffdata(assigns.sch._diff)}" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="leaf" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
    ${viewKey(Object.assign(assigns, { key: wordBreakHtml(assigns.key) }))}
    ${viewType(assigns)}
  </li>`


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

const typeTextPopulated = (sch, ui) => sch.v || ui.structSheet[sch.m].toStr[sch.t]
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
