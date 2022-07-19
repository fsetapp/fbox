import { REF } from "../../pkgs/core.js"
import * as M from "../../pkgs/model.js"
import { textInput, numberInput, integerInput, enumInput, boolInput, comboboxInput } from "../_form_inputs.js"

export const valueInput = (sch, key, opts = {}) => {
  let attrs = M.attrs[sch.t] || {}
  switch (sch.t) {
    case M.BOOLEAN:
      let boolOpts = { collection: [["t", "True"], ["f", "False"], ["i", "Unset"]], selected: value(sch, key, "i") }
      return enumInput(sch, key, Object.assign(opts, boolOpts))
    case M.INTEGER:
    case M.INT8:
    case M.INT16:
    case M.INT32:
    case M.UINT8:
    case M.UINT16:
    case M.UINT32:
    case M.FLOAT32:
    case M.FLOAT64:
      return numberInput(sch, key, Object.assign(opts, attrs))
    case M.STRING:
      return textInput(sch, key, opts)
    default:
      return ``
  }
}

const schFormats = [
  "uuid",
  "date-time", "date", "time", "duration",
  "email", "idn-email", "hostname", "idn-hostname",
  "ipv4", "ipv6",
  "uri", "uri-reference", "iri", "iri-reference", "uri-template",
  "json-pointer", "relative-json-pointer"
]

export const value = (sch, key, default_) => (sch.metadata || {})[key] || default_
const positive = (val) => Math.max(0, val)

export const renderTypeMeta = (sch) => {
  let htmls
  let attrs = M.attrs[sch.t] || {}

  switch (sch.t) {
    case M.RECORD:
      if (!sch.referrers || sch.referrers.length == 0)
        htmls = [
          boolInput(sch, "strict", { keyDisplay: "Strict" }),
        ]
      else
        htmls = []
      break
    case M.E_RECORD:
      if (!sch.referrers || sch.referrers.length == 0)
        htmls = [
          boolInput(sch, "strict", { keyDisplay: "Strict" })
        ]
      else
        htmls = []
      break
    case M.LIST:
      // "min" : 0 -------------------> sch.max
      // "max" : 0 --sch.min ---------> infinity
      htmls = [
        integerInput(sch, "min", { keyDisplay: "Min Items", min: 0, max: positive(value(sch, "max")) }),
        integerInput(sch, "max", { keyDisplay: "Max Items", min: positive(value(sch, "min", 0)) }),
        boolInput(sch, "unique", { keyDisplay: "Item uniqueness" })
      ]
      break
    case M.TUPLE: htmls = [
      integerInput(sch, "min", { keyDisplay: "Min Items", value: sch.schs.length, readonly: true }),
      integerInput(sch, "max", { keyDisplay: "Max Items", value: sch.schs.length, readonly: true })
    ]
      break
    case M.DICT: htmls = [
      integerInput(sch, "min", { keyDisplay: "Min Properties", min: 0, max: positive(value(sch, "max")) }),
      integerInput(sch, "max", { keyDisplay: "Max Properties", min: positive(value(sch, "min", 0)) })
    ]
      break
    case M.TAGGED_UNION: htmls = [
      textInput(sch, "tagname", { keyDisplay: "Tag name", value: sch.tagname })
    ]
      break
    case M.STRING:
      // "min" : 0 -------------------> sch.max
      // "max" : 0 --sch.min ---------> infinity
      htmls = [
        integerInput(sch, "min", { keyDisplay: "Min Length", min: 0, max: positive(value(sch, "max")) }),
        integerInput(sch, "max", { keyDisplay: "Max Length", min: positive(value(sch, "min", 0)) }),
        textInput(sch, "pattern", { keyDisplay: "String Pattern", maxlength: 256 }),
        comboboxInput(sch, "format", { collection: schFormats.map(a => [a, a]), keyDisplay: "Format" })
      ]
      break
    case M.INTEGER:
      htmls = [
        numberInput(sch, "min", { keyDisplay: "Min", max: value(sch, "max") }),
        numberInput(sch, "max", { keyDisplay: "Max", min: value(sch, "min") }),
        numberInput(sch, "multipleOf", { keyDisplay: "Multiple of", min: 1, max: Math.min(value(sch, "max", attrs.max), attrs.max) })
      ]
      break
    case M.INT8:
    case M.INT16:
    case M.INT32:
    case M.UINT8:
    case M.UINT16:
    case M.UINT32:
      htmls = [
        numberInput(sch, "multipleOf", { keyDisplay: "Multiple of", min: 1, max: Math.min(value(sch, "max", attrs.max), attrs.max) }),
        textInput(sch, "format", { keyDisplay: "Format" })
      ]
      break
    case M.FLOAT32:
    case M.FLOAT64: htmls = [
      numberInput(sch, "min", { keyDisplay: "Min", max: value(sch, "max") }),
      numberInput(sch, "max", { keyDisplay: "Max", min: value(sch, "min") }),
      textInput(sch, "format", { keyDisplay: "Format" })
    ]
      break
    case M.BOOLEAN: htmls = []
    case M.NULL: htmls = []
      break
    case M.UNION:
      if (sch.schs.reduce((acc, a) => !(a.fields || a.schs || a.sch) && acc, true))
        htmls = [
          boolInput(sch, "asUnion", { keyDisplay: "As Union" })
        ]
      else
        htmls = []
      break
    case REF: htmls = []

    default: htmls = []
  }

  let hasParentRecord = sch._meta.parent.t == M.RECORD
  let belowFmodelLevel = sch._meta.level > 2

  if (hasParentRecord && belowFmodelLevel) {
    switch (true) {
      case !value(sch, "isKeyPattern") && !value(sch, "required"):
        htmls.push(boolInput(sch, "required", { keyDisplay: "Required" }))
        // htmls.push(boolInput(sch, "isKeyPattern", { keyDisplay: "Pattern Key" }))
        break
      case value(sch, "isKeyPattern"):
        htmls.push(boolInput(sch, "required", { keyDisplay: "Required", readonly: true }))
        // htmls.push(boolInput(sch, "isKeyPattern", { keyDisplay: "Pattern Key" }))
        break
      case value(sch, "required"):
        htmls.push(boolInput(sch, "required", { keyDisplay: "Required" }))
        // htmls.push(boolInput(sch, "isKeyPattern", { keyDisplay: "Pattern Key", readonly: true }))
        break
    }
  }

  return htmls
}
