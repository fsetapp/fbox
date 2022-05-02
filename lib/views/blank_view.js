import { render, html } from "lit-html"

export const blankTree = (target) => renderBlankTree(target)

const renderBlankTree = (el) =>
  render(html`<ul role="tree"></ul>`, document.querySelector(el))
