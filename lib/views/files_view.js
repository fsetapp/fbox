import { html, nothing } from "lit-html"
import * as Proj from "../pkgs/proj.js"
import { autoResize, cursorEnd } from "../utils.js"
import { roleTree, viewItself as viewItself_, keyedOrIndexed, groupSize } from "./_iterator_view.js"
import { diffdata } from "./_diff_view.js"

export const view = (el, root, opts = {}) => roleTree(el, root, viewNode, opts)

const viewNode = (assigns) => {
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
      ${assigns.key}
      <div>
        <button data-cmd="add-folder" .putSch="${0}">+folder</button>
        <button data-cmd="add-file" .putSch="${1}">+model</button>
        <button data-cmd="add-file" .putSch="${2}">+html</button>
        <button data-cmd="add-file" .putSch="${3}">+json</button>
        <button data-cmd="add-file" .putSch="${4}">+sheet</button>
      </div>
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group" tabindex="-1">
      ${viewItself(assigns, viewNode)}
    </ul>
  </li>`

const viewFolder = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="folder" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="node" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    <dfn class="h" data-diff="${diffdata(assigns.sch._diff)}">
      ${viewKey(assigns)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
      ${viewItself(assigns, viewNode)}
    </ul>
  </li>`

const viewFile = (assigns) =>
  html`
  <li id="${assigns.path}" data-tag="file" .key="${assigns.key}" .index="${assigns.ui.index}" .sch=${assigns.sch} aria-posinset="${assigns.ui.index + 1}" class="node" role="treeitem" aria-level="${assigns.ui.level}" aria-selected="false" aria-expanded="${assigns.ui.expanded}" tabindex="-1">
    <dfn class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
      ${viewKey(assigns)}
      ${viewType(assigns)}
    </dfn>
    <ul data-group="${keyedOrIndexed(assigns.sch)}" role="group">
    </ul>
  </li>`

const viewItself = (assigns, view) =>
  viewItself_(assigns, view, fields => fields.sort((a, b) => {
    switch (true) {
      case a.tag == b.tag: return a.key < b.key ? -1 : 1
      case a.tag == Proj.FOLDER_TAG && b.tag == Proj.FILE_TAG: return -1
      case a.tag == Proj.FILE_TAG && b.tag == Proj.FOLDER_TAG: return 1
    }
  }))

const indent = (assigns, extra = 0) => `padding-left: ${((assigns.ui.level - 1) * 2) + assigns.ui.tab - 1 + extra}ch`
const textInput = (id, parentPath, content) =>
  html`<textarea id="${id}" class="no-resize" spellcheck="false" maxlength="64" rows="1" autofocus
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
  html`<span class="t">.${extText(assigns.sch, assigns.ui)}</span>`

const extText = (sch, ui) => ui.structSheet[sch.m].toStr[sch.t]
