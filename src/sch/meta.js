import * as T from "./type.js"
import { jEQ, randInt } from "../utils.js"

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
