import { render, html } from "lit-html"

export const blankTree = (target) =>
  render(html`<ol role="tree"></ol>`, document.querySelector(target))
