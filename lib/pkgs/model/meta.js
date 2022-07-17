import * as M from "../model.js"

export const save = (sch, metaForm) => {
  sch.errors = {}
  sch.changes = {}
  sch.metadata ||= {}

  validateString(sch, "title", metaForm)
  validateString(sch, "description", metaForm)
  validateEnum(sch, "rw", ["rw", "r", "w"], metaForm)
  validate(sch, metaForm)

  for (let key of Object.keys(sch.changes))
    if ((sch.errors[key] || []).length == 0 && sch.changes[key] != undefined)
      sch.metadata[key] = sch.changes[key]
    else
      delete sch.metadata[key]

  return sch
}

const validate = (sch, metaForm) => {
  let attrs = M.attrs[sch.t] || {}
  switch (sch.t) {
    case M.RECORD:
      validateTypeRecord(sch, metaForm)
      break
    case M.E_RECORD:
      validateTypeERecord(sch, metaForm)
      break
    case M.LIST:
      validateTypeList(sch, metaForm)
      break
    case M.TUPLE:
      validateTypeTuple(sch, metaForm)
      break
    case M.DICT:
      validateTypeDict(sch, metaForm)
      break
    case M.UNION:
      validateTypeUnion(sch, metaForm)
      break
    case M.TAGGED_UNION:
      validateTypeTaggedUnion(sch, metaForm)
      break
    case M.STRING:
      validateTypeString(sch, metaForm)
      break
    case M.INTEGER:
      validateTypeNumber(sch, metaForm)
      break
    case M.INT8:
    case M.INT16:
    case M.INT32:
    case M.UINT8:
    case M.UINT16:
    case M.UINT32:
      validateTypeNumber(sch, metaForm, { min: attrs.min, max: attrs.max })
      break
    case M.FLOAT32:
    case M.FLOAT64:
      validateTypeNumber(sch, metaForm)
      break
    case M.BOOLEAN:
      validateTypeBoolean(sch, metaForm)
      break
    case M.NULL:
      validateTypeNull(sch, metaForm)
      break
  }

  switch (sch._meta.parent.t) {
    case M.RECORD:
      validateBoolean(sch, "required", metaForm)
      // validateBoolean(sch, "isKeyPattern", metaForm)
      break
  }
}

const validateTypeString = (sch, metaForm) => {
  validateRegex(sch, "pattern", metaForm)
  validateInteger(sch, "min", metaForm, { min: 0 })
  validateInteger(sch, "max", metaForm, { min: 0 })
  validateString(sch, "format", metaForm)
  validateMinMax(sch, metaForm)
  validateString(sch, "default", metaForm, Object.assign(takeAssert(sch, ["min", "max", "pattern"]), { ignoreEmpty: true }))
}
const validateTypeBoolean = (sch, metaForm) => {
  validateEnum(sch, "default", ["t", "f", "i"], metaForm)
}
const validateTypeNumber = (sch, metaForm, opts) => {
  validateNumber(sch, "min", metaForm, opts)
  validateNumber(sch, "max", metaForm, opts)
  validateInteger(sch, "multipleOf", metaForm)
  validateString(sch, "format", metaForm)
  validateMinMax(sch, metaForm)
  validateNumber(sch, "default", metaForm, Object.assign(takeAssert(sch, ["min", "max", "multipleOf"]), opts))
}
const validateTypeNull = (sch, metaForm) => {
  validateNull(sch, "default", metaForm)
}
const validateTypeRecord = (sch, metaForm) => {
  validateBoolean(sch, "strict", metaForm)
}
const validateTypeERecord = (sch, metaForm) => {
  validateBoolean(sch, "strict", metaForm)
}
const validateTypeList = (sch, metaForm) => {
  validateInteger(sch, "min", metaForm, { min: 0 })
  validateInteger(sch, "max", metaForm, { min: 0 })
  validateMinMax(sch, metaForm)
  validateBoolean(sch, "unique", metaForm)
}
const validateTypeTuple = (sch, metaForm) => {
  validateInteger(sch, "min", metaForm, { min: 1 })
  validateInteger(sch, "max", metaForm, { min: 1 })
  validateMinMax(sch, metaForm)
}
const validateTypeDict = (sch, metaForm) => {
  validateInteger(sch, "min", metaForm, { min: 0 })
  validateInteger(sch, "max", metaForm, { min: 0 })
  validateMinMax(sch, metaForm)
}
const validateTypeUnion = (sch, metaForm) => {
  validateBoolean(sch, "asUnion", metaForm)
}
const validateTypeTaggedUnion = (sch, metaForm) => {
  validateString(sch, "tagname", metaForm, { min: 1 })
}

const takeAssert = (sch, keys = []) => {
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
  if (!params.hasOwnProperty(key)) return sch.changes[key] = undefined
  if (opts.ignoreEmpty && params[key] == "") return

  let str = params[key]
  let strLimit = 2 ** 18
  const byteSize = s => new Blob([s]).size;
  const has = opt => opts[opt] != undefined

  if (byteSize(str) > strLimit)
    addError(sch, key, `string size limit is ${Math.ceil(strLimit / 1024)} KB`)
  else if (has("max") && str.length > opts.max)
    addError(sch, key, `must be less than or equal ${opts.max} length`)
  else if (has("min") && str.length < opts.min)
    addError(sch, key, `must be grater than or equal ${opts.min} length`)
  else if (has("pattern") && opts["pattern"] != "") {
    let regex = new RegExp(opts.pattern)
    if (!regex.test(str))
      addError(sch, key, `must matche pattern ${opts.pattern}`)
  }
  else
    sch.changes[key] = str
}
const validateBoolean = (sch, key, params) => {
  if (!params.hasOwnProperty(key)) return sch.changes[key] = undefined
  let bool = !!params[key]
  sch.changes[key] = bool
}

const validateNumber = (sch, key, params, opts = {}) => {
  if (!params.hasOwnProperty(key)) return sch.changes[key] = undefined
  let num = parseNumber(params[key])
  const has = opt => opts[opt] != undefined

  if (!num && num != 0)
    addError(sch, key, "must be number")
  else if (has("min") && num < opts.min)
    addError(sch, key, `must be greater than or equal ${opts.min}`)
  else if (has("max") && num > opts.max)
    addError(sch, key, `must be less than than or equal ${opts.max}`)
  else if (has("multipleOf") && num % opts.multipleOf != 0)
    addError(sch, key, `must be multiple of ${opts.multipleOf}`)
  else
    sch.changes[key] = num
}
const validateInteger = (sch, key, params, opts) => {
  if (!params.hasOwnProperty(key)) return sch.changes[key] = undefined
  validateNumber(sch, key, params, opts)
  let int = sch.changes[key]

  if ((sch.errors[key] || []).length == 0 && !Number.isInteger(sch.changes[key]))
    addError(sch, key, "must be integer number")
  // else if (int > Number.MAX_SAFE_INTEGER)
  //   addError(sch, key, `must be less than or equal ${Number.MAX_SAFE_INTEGER}`)
  // else if (int < Number.MIN_SAFE_INTEGER)
  //   addError(sch, key, `must be greater than or equal ${Number.MIN_SAFE_INTEGER}`)
}
const validateRegex = (sch, key, params) => {
  if (!params.hasOwnProperty(key)) return sch.changes[key] = undefined
  validateString(sch, key, params)
  if ((sch.errors[key] || []).length == 0) {
    try {
      let regex = params[key]
      if (regex == "") return

      new RegExp(regex) // validate regex
      sch.changes[key] = regex
    } catch (e) {
      addError(sch, key, "invalid regex")
    }
  }
}
const validateMinMax = (sch, params) => {
  if (params.min && params.max) {
    let min = parseNumber(params.min)
    let max = parseNumber(params.max)

    if ((min || min == 0) && (max || max == 0) && min > max) {
      addError(sch, "min", "min is greater than max")
      addError(sch, "max", "max is less than min")
    }
  }
}
const validateNull = (sch, key, params) => {
  if (!params.hasOwnProperty(key)) return sch.changes[key] = undefined
  if (params[key] != null)
    addError(sch, key, "must be null")
  else
    sch.changes[key] = params[key]
}
const validateEnum = (sch, key, enum_, params) => {
  if (!params.hasOwnProperty(key)) return sch.changes[key] = undefined
  if (!enum_.includes(params[key]))
    addError(sch, key, `value must be one of ${enum_.join(", ")}`)
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

// export const examples = (sch) => {
//   sch.examples = []

//   if (sch.t == M.RECORD && sch.fields.length == 0)
//     sch.examples

//   else if (sch.t == M.RECORD) {
//     let acc = {}
//     for (let i = 0; i < sch.fields.length; i++) {
//       let sch_ = sch.fields[i]
//       Object.assign(acc, { [sch_.key]: examples(sch_)[0] })
//     }
//     sch.examples = [acc]
//   }

//   else if (sch.t == M.LIST) {
//     let acc = []
//     let ex1 = examples(sch.schs[i])[0]
//     let ex2 = examples(sch.schs[i])[0]
//     if (ex1) acc.push(ex1)
//     if (ex2) acc.push(ex2)
//     if (acc.length != 0) sch.examples = acc
//   }

//   else if (sch.t == M.TUPLE) {
//     let acc = []
//     for (let i = 0; i < sch.schs.length; i++) {
//       let ex1 = examples(sch.schs[i])[0]
//       let ex2 = examples(sch.schs[i])[0]
//       if (ex1) acc.push(ex1)
//       if (ex2) acc.push(ex2)
//     }
//     if (acc.length != 0) sch.examples = acc
//   }

//   else if (sch.t == M.UNION) {
//     let sch_ = sch.schs[randInt(sch.schs.length)]
//     let example = examples(sch_)[0]
//     if (example) sch.examples = [example]
//   }

//   else if (sch.t == M.STRING) {
//     let min = sch.min
//     let max = sch.max
//     let gen

//     if (sch.pattern)
//       sch.examples
//     else {
//       // if (min == null && max == null)
//       //   gen = new RandExp(/[A-Za-z0-9]{1, 16}/).gen()
//       // else if (max == null)
//       //   gen = new RandExp(/[A-Za-z0-9]{min, 16}/).gen()
//       // else if (min == null)
//       //   gen = new RandExp(/[A-Za-z0-9]{1, max}/).gen()
//       // else
//       //   gen = new RandExp(/[A-Za-z0-9]{min, max}/).gen()

//       sch.examples = ["string"]
//     }
//   }

//   else if ([...M.NUMBER, ...M.INTEGER].includes(sch.t)) {
//     let min = sch.min || 0
//     let max = sch.max || 65535
//     // let multiple_of = sch.multipleOf
//     sch.examples = [randInt(max, min), randInt(max, min), randInt(max, min)]
//   }

//   else if (sch.t == M.BOOLEAN)
//     sch.examples = [[true, false][randInt(2)]]

//   else if (sch.t == M.REF)
//     sch.examples

//   else if (sch.t == M.VALUE)
//     sch.examples = [sch.v]

//   return sch.examples
// }
