import { render, html } from "lit-html"

export const blankTree = (target) =>
  render(html`<ul role="tree"></ul>`, document.querySelector(target))
