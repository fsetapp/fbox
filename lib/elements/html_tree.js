import { TreeComponent } from "../components/tree_component.js"
import * as Actions from "../actions.js"
import { renderRoot } from "../views/html_view.js"
import { PKG_NAME as extstr } from "../pkgs/html.js"

export { HTMLTree }

const { Selects } = Actions
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
      ["dblclick", () => { }],
      ["keydown", {
        pre: Selects.preventDefaultScroll,
        selector: [
          ["textarea", {
            kbd: [
              ["Enter", Actions.submitEdit],
              ["Escape", Actions.escapeEdit]
            ]
          }]
        ],
        kbd: [
          ["shift-meta-ArrowUp", Selects.selectMultiNodeUpTo],
          ["shift-meta-ArrowDown", Selects.selectMultiNodeDownTo],
          ["shift-ArrowUp", Selects.selectMultiNodeUp],
          ["shift-ArrowDown", Selects.selectMultiNodeDown],
          ["meta-ArrowUp", Selects.selectUpEnd],
          ["meta-ArrowDown", Selects.selectDownEnd],
          ["ArrowUp", Selects.selectUp],
          ["ArrowLeft", Selects.collapseSelected],
          ["ArrowDown", Selects.selectDown],
          ["ArrowRight", Selects.expandSelected],
          ["k", Selects.selectPrevious],
          ["j", Selects.selectNext],
          ["Home", Selects.selectRoot],
          ["End", Selects.selectLast],

          ["shift-+", Actions.addSch],
          ["Enter", Actions.activateEditText],
          ["shift-Enter", Actions.insertBlank],
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
          ["alt-ArrowLeft", Actions.unwrapAfter],
          ["alt-ArrowRight", Actions.wrapBefore],

          // ["ArrowRight", Actions.expandSelected],
          // ["ArrowLeft", Actions.collapseSelected],
          ["Escape", Actions.clearClipboard]
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
