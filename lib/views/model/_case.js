import { html } from "lit-html"

import { is } from "../../sch.js"
import * as M from "../../pkgs/model.js"

import { treeItem, viewItself, groupSize, keyedOrIndexed } from "../_iterator_view.js"
import { diffdata } from "../_diff_view.js"
import viewKST from "./_kst_view.js"

export const byCase = assigns => {
  const { parent, sch, ui } = assigns
  const typeNode = { nodeclass: "node type", expanded: true }
  const modelLeaf = { nodeclass: "leaf type" }

  switch (true) {
    case is(sch, M.list()):
      if (!!sch.sch.fields || !!sch.sch.schs)
        assigns.item = typeNode
      else {
        assigns.item = typeNode
        assigns.item.expanded = false
      }

      return treeItem(assigns, viewNode)

    case !!sch.fields || !!sch.schs || !!sch.sch:
      assigns.item = typeNode
      return treeItem(assigns, viewNode)

    default:
      assigns.item = modelLeaf
      return treeItem(assigns, viewLeaf)
  }
}

const viewNode = assigns =>
  html`
  <div class="h" data-diff="${diffdata(assigns.sch._diff)}" data-group-size="${groupSize(assigns.sch)}">
    ${viewKST(assigns)}
  </div>
  <ol data-group="${keyedOrIndexed(assigns.sch)}" role="group">
    ${viewItself(assigns, byCase)}
  </ol>`

const viewLeaf = assigns => viewKST(assigns)
