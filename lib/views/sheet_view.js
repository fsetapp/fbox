import { html } from "lit-html"

import { is } from "../sch.js"
import * as S from "../pkgs/sheet.js"
import * as M from "../pkgs/model.js"

import { roleTree, treeItem, viewItself } from "./_iterator_view.js"
import * as modelCase from "./model/_case.js"
import * as dataView from "./data_view.js"

export const renderRoot = (el, root, opts = {}) => roleTree(el, root, byCase, opts)

const byCase = assigns => {
  const { sch, ui, parent } = assigns

  switch (true) {
    case ui.level == ui.rootLevel:
      assigns.item = { nodeclass: "root-item" }
      return treeItem(assigns, viewRootItem)

    case is(parent, S.data()):
      return dataView.byCase(assigns)

    case is(sch, S.data()):
      return dataView.byCase(assigns)

    default:
      return modelCase.byCase(assigns)
  }
}

const viewRootItem = assigns =>
  html`
  <header class="h">
    <h1 class="file-name">${assigns.key}</h1>
    <div>
      <button data-cmd="add-data" .putSch="${S.data}">add data</button>
    </div>
  </header>
  <ol data-group="keyed" role="group" tabindex="-1">
    ${viewItself(assigns, byCase)}
  </ol>
  `
