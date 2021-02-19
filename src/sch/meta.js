import * as T from "./type.js"
import { jEQ, randInt } from "../utils.js"


export const save = (sch, metaForm) => {
  sch.errors ||= {}
  sch.changes ||= {}

  for (let key of Object.keys(sch.changes))
    delete sch.errors[key]

  validateString(sch, "title", metaForm)
  validateString(sch, "description", metaForm)
  validateEnum(sch, "rw", ["rw", "r", "w"], metaForm)
  validateBoolean(sch, "required", metaForm)
  validate(sch, metaForm)

  for (let key of Object.keys(sch.changes))
    if ((sch.errors[key] || []).length == 0)
      sch[key] = sch.changes[key]
    else
      delete sch[key]

  return sch
}

const validate = (sch, metaForm) => {
  if (sch.type == T.RECORD)
    validateTypeRecord(sch, metaForm)
  else if (sch.type == T.LIST)
    validateTypeList(sch, metaForm)
  else if (sch.type == T.TUPLE)
    validateTypeTuple(sch, metaForm)
  else if (sch.type == T.UNION)
    validateTypeUnion(sch, metaForm)
  else if (sch.type == T.STRING)
    validateTypeString(sch, metaForm)
  else if (sch.type == T.NUMBER)
    validateTypeNumber(sch, metaForm)
  else if (sch.type == T.BOOLEAN)
    validateTypeBoolean(sch, metaForm)
  else if (sch.type == T.NULL)
    validateTypeNull(sch, metaForm)
}

const validateTypeString = (sch, metaForm) => {
  validateRegex(sch, "pattern", metaForm)
  validateInteger(sch, "min", metaForm, { min: 0 })
  validateInteger(sch, "max", metaForm, { min: 0 })
  validateMinMax(sch, metaForm)
  validateString(sch, "default", metaForm, getValidator(sch, ["min", "max", "pattern"]))
}
const validateTypeBoolean = (sch, metaForm) => {
  validateBoolean(sch, "default", metaForm)
}
const validateTypeNumber = (sch, metaForm) => {
  validateNumber(sch, "min", metaForm)
  validateNumber(sch, "max", metaForm)
  validateInteger(sch, "multipleOf", metaForm)
  validateMinMax(sch, metaForm)
  validateNumber(sch, "default", metaForm, getValidator(sch, ["min", "max", "multipleOf"]))
}
const validateTypeNull = (sch, metaForm) => {
  validateNull(sch, "default", metaForm)
}
const validateTypeRecord = (sch, metaForm) => {
  validateInteger(sch, "min", metaForm, { min: 0 })
  validateInteger(sch, "max", metaForm, { min: 0 })
  validateMinMax(sch, metaForm)
}
const validateTypeList = (sch, metaForm) => {
  validateInteger(sch, "min", metaForm, { min: 1 })
  validateInteger(sch, "max", metaForm, { min: 1 })
  validateMinMax(sch, metaForm)
  validateBoolean(sch, "unique", metaForm)
}
const validateTypeTuple = (sch, metaForm) => {
  validateInteger(sch, "min", metaForm, { min: 1 })
  validateInteger(sch, "max", metaForm, { min: 1 })
  validateMinMax(sch, metaForm)
}
const validateTypeUnion = (sch, metaForm) => {

}

const getValidator = (sch, keys = []) => {
  let validator = {}

  for (let key of keys) {
    if ((sch.errors[key] || []).length != 0) continue

    if (typeof sch.changes[key] == "number") {
      if (sch.changes[key] || sch.changes[key] == 0)
        validator[key] = sch.changes[key]
    }
    else
      validator[key] = sch.changes[key]
  }
  return validator
}

const validateString = (sch, key, params, opts = {}) => {
  if (!params.hasOwnProperty(key)) return

  let str = params[key]
  let strLimit = 2 ** 20
  const byteSize = s => new Blob([s]).size;

  if (byteSize(str) > strLimit)
    addError(sch, key, `must be less than or equal ${strLimit} bytes`)
  else if (opts.max && str.length > opts.max)
    addError(sch, key, `must be less than or equal ${opts.max} length`)
  else if (opts.min && str.length < opts.min)
    addError(sch, key, `must be grater than or equal ${opts.min} length`)
  else if (opts.pattern) {
    let regex = new RegExp(opts.pattern)
    if (!regex.test(str))
      addError(sch, key, `must matche pattern ${opts.pattern}`)
  }
  else
    sch.changes[key] = str
}
const validateBoolean = (sch, key, params) => {
  if (!params.hasOwnProperty(key)) return sch.changes[key] = false

  let bool = parseBool(params[key])

  if (bool == undefined)
    addError(sch, key, "must be boolean")
  else
    sch.changes[key] = bool
}
const validateNumber = (sch, key, params, opts = {}) => {
  if (!params.hasOwnProperty(key)) return
  let num = parseNumber(params[key])

  if (!num && num != 0)
    addError(sch, key, "must be number")
  else if (opts.min && num < opts.min)
    addError(sch, key, `must be greater than or equal ${opts.min}`)
  else if (opts.max && num > opts.max)
    addError(sch, key, `must be less than than or equal ${opts.max}`)
  else if (opts.multipleOf && num % opts.multipleOf != 0)
    addError(sch, key, `must be multiple of ${opts.multipleOf}`)
  else
    sch.changes[key] = num
}
const validateInteger = (sch, key, params, opts) => {
  if (!params.hasOwnProperty(key)) return
  validateNumber(sch, key, params, opts)
  let int = sch.changes[key]

  if ((sch.errors[key] || []).length == 0 && !Number.isInteger(sch.changes[key]))
    addError(sch, key, "must be integer number")
  else if (int > Number.MAX_SAFE_INTEGER)
    addError(sch, key, `must be less than or equal ${Number.MAX_SAFE_INTEGER}`)
  else if (int < Number.MIN_SAFE_INTEGER)
    addError(sch, key, `must be greater than or equal ${Number.MIN_SAFE_INTEGER}`)
}
const validateRegex = (sch, key, params) => {
  if (!params.hasOwnProperty(key)) return
  validateString(sch, key, params)
  if ((sch.errors[key] || []).length == 0) {
    try {
      let regex = params[key]
      if (regex == "") return

      sch.changes[key] = new RegExp(regex)
    } catch (e) {
      addError(sch, key, "invalid regex")
    }
  }
}
const validateMinMax = (sch, params) => {
  if (params.min && params.max)
    if (params.min > params.max) {
      addError(sch, "min", "min is greater than max")
      addError(sch, "max", "max is less than min")
    }
}
const validateNull = (sch, key, params) => {
  if (!params.hasOwnProperty(key)) return
  if (params[key] != null)
    addError(sch, key, "must be null")
  else
    sch.changes[key] = params[key]
}
const validateEnum = (sch, key, enum_, params) => {
  if (!params.hasOwnProperty(key)) return
  if (!enum_.includes(params[key]))
    addError(sch, key, "value must be r, w, or rw")
  else
    sch.changes[key] = params[key]
}
const addError = (sch, key, msg) => {
  sch.errors[key] = []
  sch.errors[key].push(msg)
}

const parseNumber = (val) => parseVal(val, "number")
const parseBool = (val) => parseVal(val, "boolean")
const parseString = (val) => parseVal(val, "string")

const parseVal = (v, type) => {
  try {
    v = JSON.parse(v)
    if (type == typeof v) return v
    else return undefined
  }
  catch (e) {
    return undefined
  }
}

export const examples = (sch) => {
  sch.examples = []

  if (sch.type == T.RECORD && jEQ(sch.fields, {}))
    sch.examples

  else if (sch.type == T.RECORD) {
    let acc = {}
    for (let i = 0; i < sch.order.length; i++) {
      let k = sch.order[i]
      let sch_ = sch.fields[k]
      Object.assign(acc, { [k]: examples(sch_)[0] })
    }
    sch.examples = [acc]
  }

  else if (sch.type == T.LIST) {
    let acc = []
    let ex1 = examples(sch.schs[i])[0]
    let ex2 = examples(sch.schs[i])[0]
    if (ex1) acc.push(ex1)
    if (ex2) acc.push(ex2)
    if (acc.length != 0) sch.examples = acc
  }

  else if (sch.type == T.TUPLE) {
    let acc = []
    for (let i = 0; i < sch.schs.length; i++) {
      let ex1 = examples(sch.schs[i])[0]
      let ex2 = examples(sch.schs[i])[0]
      if (ex1) acc.push(ex1)
      if (ex2) acc.push(ex2)
    }
    if (acc.length != 0) sch.examples = acc
  }

  else if (sch.type == T.UNION) {
    let sch_ = sch.schs[randInt(sch.schs.length)]
    let example = examples(sch_)[0]
    if (example) sch.examples = [example]
  }

  else if (sch.type == T.STRING) {
    let min = sch.min
    let max = sch.max
    let gen

    if (sch.pattern)
      sch.examples
    else {
      // if (min == null && max == null)
      //   gen = new RandExp(/[A-Za-z0-9]{1, 16}/).gen()
      // else if (max == null)
      //   gen = new RandExp(/[A-Za-z0-9]{min, 16}/).gen()
      // else if (min == null)
      //   gen = new RandExp(/[A-Za-z0-9]{1, max}/).gen()
      // else
      //   gen = new RandExp(/[A-Za-z0-9]{min, max}/).gen()

      sch.examples = ["string"]
    }
  }

  else if (sch.type == T.NUMBER) {
    let min = sch.min || 0
    let max = sch.max || 65535
    // let multiple_of = sch.multipleOf
    sch.examples = [randInt(max, min), randInt(max, min), randInt(max, min)]
  }

  else if (sch.type == T.BOOLEAN)
    sch.examples = [[true, false][randInt(2)]]

  else if (sch.type == T.NULL)
    sch.examples = [null]

  else if (sch.type == T.ANY)
    sch.examples

  else if (sch.type == T.REF)
    sch.examples

  else if (sch.type == T.VALUE)
    sch.examples = [sch.const]

  return sch.examples
}
