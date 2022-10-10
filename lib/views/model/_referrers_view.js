// TODO: Implement stacktrace-like all the way up to the leaf definition
const viewReferrers = (referrers) => {
  if (referrers.length != 0) return html`
    <p class="referrers">Referrers</p>
    <ul>
      ${referrers.map(r => html`<li>${r._meta.lpath.slice(1).map(a => a.key || a.index || a._meta.index).join(" / ")}</li>`)}
    </ul>
    `
  else return nothing
}
