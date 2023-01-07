import { html, nothing } from "lit-html"
import * as Proj from "../pkgs/proj.js"
import { autoResize, cursorEnd, b } from "../utils.js"
import { roleTree, treeItem, viewItself as viewItself_, keyedOrIndexed, groupSize } from "./_iterator_view.js"
import { diffdata } from "./_diff_view.js"

export const view = (el, root, opts = {}) => roleTree(el, root, viewNode, opts)

const viewNode = (assigns) => {
  const { ui, sch } = assigns

  switch (true) {
    case ui.level == ui.rootLevel:
      assigns.item = { nodeclass: "root-item" }
      return treeItem(assigns, viewRootItem)

    case [Proj.FOLDER, Proj.PROJECT].includes(sch.t):
      assigns.item = { nodeclass: `node`, expanded: b(sch.expanded, true) }
      return treeItem(assigns, viewFolder)

    case sch.t == Proj.KEEP_EXT:
      return nothing

    case sch.tag == Proj.FILE_TAG:
      assigns.item = { nodeclass: `node` }
      return treeItem(assigns, viewFile)

    default:
      return nothing
  }
}

const viewRootItem = (assigns) =>
  html`
  <dfn class="h" id="project_tree">
    ${assigns.key}
    <div>
      <button data-cmd="add-folder" .putSch="${0}">+folder</button>
      ${menus(assigns.ui)}
    </div>
  </dfn>
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
    ${viewItself(assigns, viewNode)}
  </ol>
  `

const menus = ui => {
  const { toStr, sheet } = ui.structSheet[Proj.MODULE]
  return sheet[Proj.PROJECT].children.of
    .slice(1)
    .map(file => html`<button data-cmd="add-file" .putSch="${() => file}">+${toStr[file.t]}</button>`)
}

const viewFolder = (assigns) =>
  html`
  <dfn class="h" data-diff="${diffdata(assigns.sch._diff)}">
    ${viewKey(assigns)}
  </dfn>
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group">
    ${viewItself(assigns, viewNode)}
  </ol>
  `

const viewFile = (assigns) =>
  html`
  <dfn class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKey(assigns)}
    ${viewType(assigns)}
  </dfn>
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group">
  </ol>
  `

const viewItself = (assigns, view) =>
  viewItself_(assigns, view, fields => fields.sort((a, b) => {
    switch (true) {
      case a.tag == b.tag: return a.key < b.key ? -1 : 1
      case a.tag == Proj.FOLDER_TAG && b.tag == Proj.FILE_TAG: return -1
      case a.tag == Proj.FILE_TAG && b.tag == Proj.FOLDER_TAG: return 1
    }
  }))

const indent = (assigns, extra = 0) => `padding-left: ${((assigns.ui.level - 1) * 2) + assigns.ui.tab - 1 + extra}ch`
const textInput = (id, parentId, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="64" rows="1" autofocus
  data-parent-id="${parentId}"
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
    textInput("key-edit", assigns.ui.parentId, assigns.key) :
    html`${assigns.key}`

const viewType = (assigns) => viewTypeNonTop(assigns)
const viewTypeNonTop = (assigns) =>
  html`<span class="t">.${extText(assigns.sch, assigns.ui)}</span>`

const extText = (sch, ui) => ui.structSheet[sch.m].toStr[sch.t]
