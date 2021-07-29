import { html } from "lit-html"
import * as T from "../sch/type.js"
import { writable } from "../utils.js"

export const typeText = (sch, ui) => {
  let text
  let metadata = sch.metadata

  switch (true) {
    case sch.t == T.RECORD && sch.fields.length == 0 && metadata?.strict: text = "{ empty }"; break
    case sch.t == T.RECORD && sch.fields.length == 0: text = "{ any }"; break
    case sch.t == T.RECORD && metadata?.strict: text = `{ strict }`; break
    case sch.t == T.RECORD: text = `{ \xa0 }`; break
    case sch.t == T.E_RECORD && metadata?.strict: text = `{ e | r strict }`; break
    case sch.t == T.E_RECORD: text = `{ e | r }`; break
    case sch.t == T.LIST: text = html`[\xa0 ${typeText(sch.sch, ui)} \xa0]`; break
    case sch.t == T.TUPLE: text = "( \xa0 )"; break
    case sch.t == T.DICT: text = `dict`; break
    case sch.t == T.UNION: text = "||"; break
    case sch.t == T.TAGGED_UNION: text = `|| ${metadata?.tagname || sch.tagname}`; break

    case sch.t == T.STRING:
      text = "string"
      if (ui.showMeta && metadata?.pattern)
        text = html`<span style="flex-shrink:0">${text}</span> <span class="m pattern">/${metadata.pattern}/<span>`
      break
    case sch.t == T.INTEGER: text = "integer"; break
    case sch.t == T.INT8: text = "int_8"; break
    case sch.t == T.INT16: text = "int_16"; break
    case sch.t == T.INT32: text = "int_32"; break
    case sch.t == T.UINT8: text = "uint_8"; break
    case sch.t == T.UINT16: text = "uint_16"; break
    case sch.t == T.UINT32: text = "uint_32"; break
    case sch.t == T.FLOAT32: text = "float_32"; break
    case sch.t == T.FLOAT64: text = "float_64"; break
    case sch.t == T.BOOLEAN: text = "bool"; break
    case sch.t == T.NULL: text = "nil"; break
    case sch.t == T.ANY: text = "any"; break
    case sch.t == T.REF && !!ui.models[sch.$r]:
      writable(sch, "_text", typeTextPopulated(sch, ui))
      text = html`<span class="ref" ._a="${sch.$r}">${sch._text}</span >`
      break
    case sch.t == T.REF && sch.$r == null: text = html`<span class="ref" title="Ref type">{ }</span>`; break
    case sch.t == T.REF: text = html`<span class="ref notfound" title="Ref type">${`${sch._text || sch.$r} (#404)`}</span>`; break
    case sch.t == T.VALUE: text = html`<span class="value" title="Value type">${typeTextPopulated(sch, ui)}</span>`; break
    default: text = "# UNDEFINED_TYPE #"
  }

  if (ui.tText) text = ui.tText(sch, ui) || text
  return text
}

export const typeTextPopulated = (sch, ui) => {
  switch (true) {
    case sch.t == T.VALUE:
      return JSON.stringify(sch.v)
    case sch.t == T.REF:
      return ui.models[sch.$r]?.display
    default:
      return T.toStr(sch.t)
  }
}
