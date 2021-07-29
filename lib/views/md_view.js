import "../vendor/insane.min.js"
import snarkdown from 'snarkdown'

customElements.define("t-md", class extends HTMLElement {
  connectedCallback() {
    this.innerHTML = insane(snarkdown(this.textContent))
  }
})
