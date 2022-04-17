export const match = (obj, selector) => {
  if (!obj) return false

  let acc = true
  switch (true) {
    case typeof selector == "boolean":
      acc = selector
      break
    case Array.isArray(selector):
      for (let s of selector) {
        const attr = s[0]
        const attrVal = s[1]
        if (obj[attr] == undefined || attrVal == undefined) return false

        if (Array.isArray(attrVal))
          acc = acc && attrVal.includes(obj[attr])
        else
          acc = acc && obj[attr] == attrVal
      }
  }
  return acc
}
