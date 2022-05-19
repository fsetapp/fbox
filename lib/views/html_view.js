import { render, html, nothing } from "lit-html"
import { ifDefined } from "lit-html/directives/if-defined.js"

import * as Html from "../pkgs/html.js"
import { autoResize, autoWidth, cursorEnd } from "../utils.js"
import { viewItself, keyedOrIndexed } from "./_iterator_view.js"
import { diffdata, ifTagdata } from "./_diff_view.js"

export const renderRoot = (el, root, opts = {}) => {
  try {
    let ui = Object.assign({
      rootLevel: 1,
      level: 1,
      tab: opts.ui?.tab || 0,
      models: root._models || {},
      structSheet: root.structSheet
    }, opts.ui)

    if (opts.ui.lineClass) Object.assign(ui, { tab: opts.ui.tab + 2 })

    render(
      html`<ol role="tree" aria-multiselectable="true" class="${`${ui.lineClass || ''} text-sm`}" aria-label="${root.key + " body"}">
        ${viewTreeitem({
        key: root.key,
        sch: root,
        parent: root,
        ui: ui,
        path: ""
      })}</ol>`, document.querySelector(el))
  }
  catch (e) { console.log(e); }
}

const errordata = ({ m, t, terror }, { structSheet }) =>
  ifDefined(terror?.map(e => structSheet[m].toStr[t]).join(","))

const viewTreeitem = (assigns) => {
  const treeitem = ({ sch, item, ui, key, path }, itemView) =>
    html`<li id="${path}" class="${item.nodeclass} ${tagText(sch, ui)}" .key="${key}" .index="${ui.index || 0}" .sch="${sch}" data-diff="${diffdata(sch._diff)}" data-sig="${errordata(sch, ui)}" data-tag="${ifTagdata(sch.tag)}" role="treeitem" aria-level="${ui.level}" aria-posinset="${ui.index || 0 + 1}" aria-selected="false" tabindex="-1" aria-expanded="${ifDefined(item.expanded)}">${itemView(assigns)}</li>`

  switch (true) {
    case assigns.ui.level == assigns.ui.rootLevel:
      assigns.item = { nodeclass: "root-item", expanded: true }
      return treeitem(assigns, viewRootItem)

    case assigns.ui.level == assigns.ui.rootLevel + 1:
      assigns.item = { nodeclass: "node", expanded: true }
      return treeitem(assigns, viewTop)

    // case !!Html.phrasingContent[assigns.sch.t]:
    //   assigns.item = { nodeclass: "node phrasing" }
    //   return treeitem(assigns, viewLeaf)

    case assigns.sch.hasOwnProperty("fields") || assigns.sch.hasOwnProperty("schs"):
      assigns.item = { nodeclass: "node", expanded: true }
      return treeitem(assigns, viewNode)

    default:
      assigns.item = { nodeclass: "leaf" }
      return treeitem(assigns, viewLeaf)
  }
}

const viewRootItem = (assigns) =>
  html`
  <span class="h">${assigns.key}</span>
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
    ${viewItself(assigns, viewTreeitem)}
  </ol>`

const viewTop = (assigns) =>
  html`
  ${editableKey(assigns)}
  ${editableTag(assigns)}
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group">
    ${viewItself(assigns, viewTreeitem)}
  </ol>`

const viewNode = (assigns) =>
  html`
  ${editableTag(assigns)}
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group">
    ${viewItself(assigns, viewTreeitem)}
  </ol>`

const viewLeaf = (assigns) =>
  html`
  ${editableTag(assigns)}
  ${editableText(assigns)}`

const indent = (assigns, extra = 0) => `padding-left: ${((assigns.ui.level - 1) * 2) + assigns.ui.tab - 1 + extra}ch`
const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-path="${parentPath}"
  data-newline="false"
  @input="${autoWidth}"
  @focus="${cursorEnd}"
  .value=${content}
  ></textarea>`

const longTextInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" rows="1" autofocus
  data-parent-path="${parentPath}"
  data-newline="false"
  @input="${autoResize}"
  @focus="${cursorEnd}"
  .value=${content}
  ></textarea>`

const editableKey = (assigns) =>
  (assigns.sch.uiMode == "editKey") ?
    textInput("key-edit", assigns.ui.parentPath, assigns.key) :
    html`${assigns.key}`

const editableVal = (assigns) =>
  (assigns.sch.uiMode == "editVal") ?
    longTextInput("val-edit", assigns.ui.parentPath, assigns.key) :
    html`${assigns.sch.v}`

const editableText = (assigns) => {
  switch (true) {
    case assigns.sch.uiMode == "editVal":
      return html`<combo-box class="v">
        ${textInput("val-edit", assigns.ui.parentPath, assigns.sch.v)}
      </combo-box>`

    default:
      return html`<span class="v">${editableVal(assigns)}</span>`
  }
}
const editableTag = (assigns) => {
  switch (true) {
    case assigns.sch.uiMode == "editType":
      return html`<combo-box class="t" id="type_search" list="typesearch">
        ${textInput("type-edit", assigns.ui.parentPath, tagTextPopulated(assigns.sch, assigns.ui))}
      </combo-box>`

    case assigns.sch.t == Html.TEXT:
      return html`<span class="t text">•</span>`

    default:
      return html`<span class="t">${tagText(assigns.sch, assigns.ui)}</span>`
  }
}

const tagTextPopulated = (sch, ui) => tagText(sch, ui)
const tagText = (sch, ui) => ui.structSheet[sch.m].toStr[sch.t]
