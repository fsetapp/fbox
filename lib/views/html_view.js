import { render, html } from "lit-html"
import { ifDefined } from "lit-html/directives/if-defined.js"

import * as Html from "../pkgs/html.js"
import { autoWidth, cursorEnd } from "../utils.js"
import { viewItself, keyedOrIndexed } from "./_iterator_view.js"
import { diffdata, ifTagdata, tagdata } from "./_diff_view.js"

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

    viewMain(el, {
      key: root.key,
      sch: root,
      parent: root,
      ui: ui,
      path: "",
    })
  }
  catch (e) { console.log(e); }
}

const viewMain = (el, assigns) =>
  render(html`
  <ol role="tree" aria-multiselectable="true" class="${`${assigns.ui.lineClass || ''} text-sm`}" aria-labelledby="${tagdata(assigns.sch.tag) + "_tree"}">
    ${viewElement(assigns)}
  </ol>
  `, document.querySelector(el))

const errordata = ({ m, t, terror }, { structSheet }) =>
  ifDefined(terror?.map(e => structSheet[m].toStr[t]).join(","))

const viewElement = (assigns) => {
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
      ${viewItself(assigns, viewElement)}
    </ol>
  </li>`

const viewNode = (assigns) =>
  html`
  <li id="${assigns.path}" data-diff="${diffdata(assigns.sch._diff)}" data-sig="${errordata(assigns.sch, assigns.ui)}" data-tag="${ifTagdata(assigns.sch.tag)}" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="node" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    ${editableType(assigns)}
    <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group">
      ${viewItself(assigns, viewElement)}
    </ol>
  </li>`

const viewLeaf = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="${ifTagdata(assigns.sch.tag)}" data-sig="${errordata(assigns.sch, assigns.ui)}" data-diff="${diffdata(assigns.sch._diff)}" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="leaf" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" tabindex="-1">
    ${editableType(assigns)}
  </li>`

const indent = (assigns, extra = 0) => `padding-left: ${((assigns.ui.level - 1) * 2) + assigns.ui.tab - 1 + extra}ch`
const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="255" rows="1" autofocus
  data-parent-path="${parentPath}"
  data-newline="false"
  @input="${autoWidth}"
  @focus="${cursorEnd}"
  .value=${content}
  ></textarea>`

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
const typeText = (sch, ui) => ui.structSheet[sch.m].toStr[sch.t]
