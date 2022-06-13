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
      assigns.item = { nodeclass: "root-item", expanded: true }
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
  <span class="h">${assigns.key}</span>
  <div>
    <button data-cmd="add-type" .putSch="${M.record}">add type</button>
    <button data-cmd="add-data" .putSch="${S.data}">add data</button>
  </div>
  <ol data-group="keyed" role="group" tabindex="-1">
    ${viewItself(assigns, byCase)}
  </ol>
  `
