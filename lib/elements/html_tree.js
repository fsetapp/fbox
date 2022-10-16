import { TreeComponent } from "../components/tree_component.js"
import * as A from "../actions.js"
import * as H from "../actions/html.js"
import { renderRoot } from "../views/html_view.js"
import { PKG_NAME as extstr } from "../pkgs/html.js"

export { HTMLTree }

const S = A.Selects
const HTMLTree = (conf = {}, store) => {
  let { target } = conf
  document.querySelector(target).setAttribute("data-ext", extstr)

  const renderHtml = s => renderRoot(target, s, {
    ui: {
      tab: 3,
      modelTypeText: (sch, ui) => sch.isEntry ? "entrypoint" : "type",
    }
  })

  TreeComponent({
    store,
    target,
    domEvents: [
      ["click", S.clickSelect],
      ["dblclick", () => { }],
      ["keydown", {
        pre: S.preventDefaultScroll,
        selector: [
          ["textarea", {
            kbd: [
              ["Enter", A.submitEdit],
              ["Escape", A.escapeEdit]
            ]
          }]
        ],
        kbd: [
          ["shift-meta-ArrowUp", S.selectMultiNodeUpTo],
          ["shift-meta-ArrowDown", S.selectMultiNodeDownTo],
          ["shift-ArrowUp", S.selectMultiNodeUp],
          ["shift-ArrowDown", S.selectMultiNodeDown],
          ["meta-ArrowUp", S.selectUpEnd],
          ["meta-ArrowDown", S.selectDownEnd],
          ["ArrowUp", S.selectUp],
          ["ArrowDown", S.selectDown],
          ["k", S.selectPrevious],
          ["j", S.selectNext],
          ["Home", S.selectRoot],
          ["End", S.selectLast],

          ["shift-+", A.addSch],
          ["t", A.activateEditKey],
          ["e", A.activateEditKey],
          ["shift-Enter", H.insertTextNode],
          ["Enter", A.activateEditText],
          ["Delete", A.deleteSelected],
          ["m", A.markAsEntry],

          ["meta-x", A.cut],
          ["meta-c", A.copy],
          ["meta-v", A.paste],
          ["shift-alt-ArrowUp", A.cloneUp],
          ["shift-alt-ArrowDown", A.cloneDown],
          ["alt-ArrowUp", A.reorderUp],
          ["alt-ArrowDown", A.reorderDown],
          ["alt-ArrowLeft", A.unwrapAfter],
          ["alt-ArrowRight", A.wrapBefore],

          ["ArrowRight", A.expandSelected],
          ["ArrowLeft", A.collapseSelected],
          ["Escape", A.clearClipboard]
        ]
      }
      ]],
    view: { render: renderHtml },
    opts: {
      focus: conf.focus,
      selectId: conf.select
    }
  })
}
