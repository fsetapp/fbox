import { html } from "lit-html"
import * as M from "../pkgs/model.js"
import * as Core from "../pkgs/core.js"
import { s } from "../pkgs/registry.js"
import { writable } from "../utils.js"

const CorePkg = s(Core).t
const isCoreRef = sch => sch.m == CorePkg && sch.t == Core.REF

export const typeText = (sch, ui) => {
  let text
  let metadata = sch.metadata

  switch (true) {
    case sch.t == M.RECORD && sch.fields.length == 0 && metadata?.strict: text = "{ empty }"; break
    case sch.t == M.RECORD && sch.fields.length == 0: text = "{ any }"; break
    case sch.t == M.RECORD && metadata?.strict: text = `{ strict }`; break
    case sch.t == M.RECORD: text = `{ \xa0 }`; break
    case sch.t == M.E_RECORD && metadata?.strict: text = `{ e | r strict }`; break
    case sch.t == M.E_RECORD: text = `{ e | r }`; break
    case sch.t == M.LIST: text = html`[\xa0 ${typeText(sch.sch, ui)} \xa0]`; break
    case sch.t == M.TUPLE: text = "( \xa0 )"; break
    case sch.t == M.DICT: text = `dict`; break
    case sch.t == M.UNION: text = "||"; break
    case sch.t == M.TAGGED_UNION: text = `|| ${metadata?.tagname || sch.tagname}`; break

    case sch.t == M.STRING:
      text = "string"
      if (ui.showMeta && metadata?.pattern)
        text = html`<span style="flex-shrink:0">${text}</span> <span class="m pattern">/${metadata.pattern}/<span>`
      break
    case sch.t == M.INTEGER: text = "integer"; break
    case sch.t == M.INT8: text = "int_8"; break
    case sch.t == M.INT16: text = "int_16"; break
    case sch.t == M.INT32: text = "int_32"; break
    case sch.t == M.UINT8: text = "uint_8"; break
    case sch.t == M.UINT16: text = "uint_16"; break
    case sch.t == M.UINT32: text = "uint_32"; break
    case sch.t == M.FLOAT32: text = "float_32"; break
    case sch.t == M.FLOAT64: text = "float_64"; break
    case sch.t == M.BOOLEAN: text = "bool"; break
    case sch.t == M.NULL: text = "nil"; break
    case sch.t == M.ANY: text = "any"; break
    case isCoreRef(sch) && !!ui.models[sch.$r]:
      writable(sch, "_text", typeTextPopulated(sch, ui))
      text = html`<span class="ref" ._a="${sch.$r}">${sch._text}</span >`
      break
    case isCoreRef(sch) && sch.$r == null: text = html`<span class="ref" title="Ref type">{ }</span>`; break
    case isCoreRef(sch): text = html`<span class="ref notfound" title="Ref type">${`${sch._text || sch.$r} (#404)`}</span>`; break
    case sch.t == M.VALUE: text = html`<span class="value" title="Value type">${typeTextPopulated(sch, ui)}</span>`; break
    default: text = M.toStr(sch.t) || "# UNDEFINED_TYPE #"
  }

  if (ui.tText) text = ui.tText(sch, ui) || text
  return text
}

export const typeTextPopulated = (sch, ui) => {
  switch (true) {
    case sch.t == M.VALUE:
      return JSON.stringify(sch.v)
    case isCoreRef(sch.t):
      return ui.models[sch.$r]?.display
    default:
      return M.toStr(sch.t)
  }
}
