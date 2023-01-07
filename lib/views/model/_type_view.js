import { html } from "lit-html"
import { K as M, toStr } from "../../pkgs/model.js"
import { writable } from "../../utils.js"

export const typeText = (sch, ui) => {
  let text = toStr[sch.t]
  let metadata = sch.metadata || {}

  switch (true) {
    case sch.t == M.RECORD && sch.fields.length == 0 && metadata?.strict: text = "{ empty }"; break
    case sch.t == M.RECORD && sch.fields.length == 0: text = "{ any }"; break
    case sch.t == M.RECORD && metadata?.strict: text = `{ strict }`; break
    case sch.t == M.RECORD: text = `{  }`; break
    case sch.t == M.E_RECORD && metadata?.strict: text = `{ e | r strict }`; break
    case sch.t == M.E_RECORD: text = `{ e | r }`; break
    case sch.t == M.LIST: text = html`[ ${typeText(sch.sch, ui)} ]`; break
    case sch.t == M.TUPLE: text = "(  )"; break
    case sch.t == M.UNION: text = "||"; break
    case sch.t == M.TAGGED_UNION: text = `|| ${metadata?.tagname || sch.tagname}`; break

    // case sch.hasOwnProperty("v") && sch.v == null:
    //   text = html`<span class="value">${JSON.stringify(sch.v)}</span>`; break
    case sch.hasOwnProperty("v") && !ui.isData: text = html`<span class="value">${JSON.stringify(sch.v)}</span>`; break
    case sch.t == M.STRING:
      text = "string"
      if (ui.showMeta && metadata?.pattern)
        text = html`<span style="flex-shrink:0">${text}</span> <span class="m pattern">/${metadata.pattern}/<span>`
      break
    case !!text: break
    case !!sch.$r && !!ui.models[sch.$r]:
      writable(sch, "_text", typeTextPopulated(sch, ui))
      text = html`<span class="ref" ._a="${sch.$r}">${sch._text}</span >`
      break
    case sch.$r == null: text = html`<span class="ref" title="Ref type">{ }</span>`; break
    case sch.hasOwnProperty("$r"): text = html`<span class="ref notfound" title="Ref type">${`${sch._text || sch.$r} (#404)`}</span>`; break
    default: text = "# UNDEFINED_TYPE #"
  }

  if (ui.tText) text = ui.tText(sch, ui) || text
  return text
}

export const typeTextPopulated = (sch, ui) => {
  switch (true) {
    case sch.v != undefined:
      return JSON.stringify(sch.v)
    case sch.hasOwnProperty("$r"):
      return ui.models[sch.$r]?.display || "ref"
    default:
      return toStr[sch.t]
  }
}
