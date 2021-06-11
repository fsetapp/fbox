import * as T from "../lib/sch/type.js"

export const Fixture = {
  record: (key, fields) => ({ ...T.putAnchor(T.record), key: key, fields: fields }),
  string: key => ({ ...T.putAnchor(T.string), key: key })
}

export const Cmd = {
  markAsMain: (tree) => keydown(tree, { key: "m" }),
  moveUp: (tree) => keydown(tree, { key: "ArrowUp", altKey: true }),
  moveDown: (tree) => keydown(tree, { key: "ArrowDown", altKey: true }),
  cloneUp: (tree) => keydown(Object.assign(tree, { sync: true }), { key: "ArrowUp", shiftKey: true, altKey: true }),
  cloneDown: (tree) => keydown(Object.assign(tree, { sync: true }), { key: "ArrowDown", shiftKey: true, altKey: true }),

  copy: (tree) => keydown(tree, { key: "c", metaKey: true }),
  cut: (tree) => keydown(tree, { key: "x", metaKey: true }),
  paste: (tree) => keydown(tree, { key: "v", metaKey: true }),
  remove: (tree) => keydown(tree, { key: "Delete" }),
  addItem: (tree) => keydown(tree, { key: "+", shiftKey: true }),
  click: (tree, id) => oneById(tree, id).click(),
  changekey: (tree, id, text) => changekey(tree, id, text),

  tab: (tree) => keydown(tree, { key: "Tab" }),
  tabBack: (tree) => keydown(tree, { key: "Tab", shiftKey: true }),
  enter: (tree) => keydown(tree, { key: "Enter" }),
  escape: (tree) => keydown(tree, { key: "Escape" }),
  selectUp: (tree) => keydown(tree, { key: "ArrowUp" }),
  selectDown: (tree) => keydown(tree, { key: "ArrowDown" }),
  multiSelectUp: (tree) => keydown(tree, { key: "ArrowUp", shiftKey: true, metaKey: true }),
  multiSelectDown: (tree) => keydown(tree, { key: "ArrowDown", shiftKey: true, metaKey: true })
}

export const keydown = (el, { key, altKey, ctrlKey, metaKey, shiftKey }) => {
  el.dispatchEvent(new KeyboardEvent("keydown", { key, altKey, ctrlKey, metaKey, shiftKey, bubbles: true }))
}

const changekey = (tree, id, text) => {
  Cmd.click(tree, id)
  keydown(tree, { key: "Enter" })
  let textarea = tree._walker.currentNode.querySelector("textarea")
  textarea.value = text
  keydown(textarea, { key: "Enter" })
}

export const all = (tree, { lv }) =>
  tree.querySelectorAll(`[role='treeitem'][aria-level='${lv}']`)
export const one = (tree, { lv, i }) =>
  tree.querySelector(`[role='treeitem'][aria-level='${lv}'][aria-posinset='${i}']`)
export const oneById = (tree, id) =>
  tree.querySelector(`[role='treeitem'][id${id && "=" + CSS.escape(id)}]`)
