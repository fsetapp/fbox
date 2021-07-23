import insane from "insane"
import snarkdown from 'snarkdown'

customElements.define("t-md", class extends HTMLElement {
  connectedCallback() {
    this.innerHTML = insane(snarkdown(this.textContent))
  }
})
