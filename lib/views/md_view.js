import "../vendor/insane.min.js"
import snarkdown from 'snarkdown'
import { render, html } from "lit-html"

customElements.define("t-md", class extends HTMLElement {
  connectedCallback() {
    render(html`${insane(snarkdown(this.textContent))}`, this)
  }
})
