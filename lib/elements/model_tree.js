import { TreeComponent } from "../components/tree_component.js"
import * as Actions from "../actions.js"
import { renderRoot } from "../views/model_view.js"
import { PKG_NAME as extstr } from "../pkgs/model.js"

export { ModelTree, ReadOnlyModelTree }

const S = Actions.Selects

const ModelTree = (conf = {}, store) => {
  let { target } = conf
  document.querySelector(target).setAttribute("data-ext", extstr)

  const textAreaKeyDownCmd = {
    kbd: [
      ["Enter", Actions.submitEdit],
      ["Escape", Actions.escapeEdit]
    ]
  }
  const keydownCmds = {
    pre: S.preventDefaultScroll,
    kbd: [
      ["shift-meta-ArrowUp", S.selectMultiNodeUpTo],
      ["shift-meta-ArrowDown", S.selectMultiNodeDownTo],
      ["shift-ArrowUp", S.selectMultiNodeUp],
      ["shift-ArrowDown", S.selectMultiNodeDown],
      ["meta-ArrowUp", S.selectUpEnd],
      ["meta-ArrowDown", S.selectDownEnd],
      ["ArrowUp", S.selectUp],
      ["ArrowDown", S.selectDown],
      ["k", S.selectUp],
      ["j", S.selectDown],
      ["Home", S.selectRoot],
      ["End", S.selectLast],

      ["shift-+", Actions.addSch],
      ["Enter", Actions.activateEditKey],
      ["t", Actions.activateEditType],
      ["Delete", Actions.deleteSelected],
      ["m", Actions.markAsEntry],

      ["meta-x", Actions.cut],
      ["meta-c", Actions.copy],
      ["meta-v", Actions.paste],
      ["shift-alt-ArrowUp", Actions.cloneUp],
      ["shift-alt-ArrowDown", Actions.cloneDown],
      ["alt-ArrowUp", Actions.reorderUp],
      ["alt-ArrowDown", Actions.reorderDown],

      ["ArrowRight", Actions.expandSelected],
      ["ArrowLeft", Actions.collapseSelected],
      ["Escape", Actions.clearClipboard]
    ],
    selector: [
      ["textarea", textAreaKeyDownCmd]
    ]
  }

  const render = s => renderRoot(target, s, {
    ui: {
      tab: 1,
      modelTypeText: (sch, ui) => sch.isEntry ? "entrypoint" : "type",
    }
  })

  TreeComponent({
    store,
    target,
    domEvents: [
      ["click", { selector: [["*", S.clickSelect]] }],
      ["dblclick", Actions.activateEditTarget],
      ["keydown", keydownCmds],
    ],
    view: { render },
    opts: {
      focus: conf.focus,
      selectId: conf.select
    }
  })
}

const ReadOnlyModelTree = (conf = {}, store) => {
  let { target, select, focus = false } = conf
  document.querySelector(target).setAttribute("data-ext", extstr)

  const render = s => renderRoot(target, s, {
    ui: {
      lineClass: "setnu",
      tab: 3,
      modelTypeText: (sch, ui) => sch.isEntry ? "entrypoint" : "type",
    }
  })

  TreeComponent({
    store,
    target,
    treeKeyDownCmds: [
      ["ArrowUp", S.selectUp],
      ["ArrowDown", S.selectDown],
      ["ArrowRight", S.expandSelected],
      ["ArrowLeft", S.collapseSelected],
    ],
    textAreaKeyDownCmd: [
    ],
    view: { render },
    opts: {
      focus: focus,
      selectId: select
    }
  })
}
