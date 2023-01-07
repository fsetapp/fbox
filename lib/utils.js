export const b = (bool, default_) => typeof bool != "boolean" ? default_ : bool
export const randInt = (max, min = 0) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min)
}
export const jEQ = (obj1, obj2) => JSON.stringify(obj1) == JSON.stringify(obj2)
export const autoWidth = extra => e => {
  if (e.target.dataset.newline != "false")
    e.target.value = e.target.value.replace(/\n/g, "")

  if (e.target.type == "text" || e.target.type == "textarea")
    e.target.parentNode.dataset.text = e.target.value

  let inputParent = e.target.closest("[data-text]")
  switch (true) {
    case !!inputParent && inputParent.dataset.text.trim().length == 0:
      e.target.style.maxWidth = "5ch"
      break
    case !!inputParent:
      const afterWidth = Number.parseFloat(window.getComputedStyle(inputParent, ":after").width)
      e.target.style.maxWidth = `calc(${afterWidth}px + 1rem)`
      break
    default:
      e.target.style.maxWidth = `${e.target.value.length + 1 + extra}ch`
  }
}

export const autoHeight = (e) => {
  e.target.style.overflow = "hidden"
  e.target.style.height = "auto"
  e.target.style.height = `${e.target.scrollHeight}px`
}
export const autoResize = (e) => {
  autoWidth(2)(e)
  autoHeight(e)
}
export const cursorEnd = (e) => {
  autoResize(e)
  e.target.select()
}

const { defineProperty } = Object
const def = defineProperty
export const readable = (o, k, v) => def(o, k, { value: v, configurable: true })
export const writable = (o, k, v) => def(o, k, { value: v, configurable: true, writable: true })

export const buffer = function (func, wait, scope) {
  var timer = null;
  return function () {
    if (timer) clearTimeout(timer)
    var args = arguments
    timer = setTimeout(function () {
      timer = null
      func.apply(scope, args)
    }, wait)
  }
}

export const find = (collection, f) => {
  for (let i = 0; i < collection.length; i++)
    if (f(collection[i])) return collection[i]
    else continue
}

export const forEach = (collection, f) => {
  for (let i = 0; i < collection.length; i++)
    f(collection[i], i)
}

export const map = (collection, f) =>
  reduce(collection, (acc, a, i) => acc.push(f(a)) && acc, [])

export const reduce = (collection, f, acc) => {
  for (let i = 0; i < collection.length; i++)
    acc = f(acc, collection[i], i)

  return acc
}

// simply json scoped impl
export const deepMerge = (dst, src) => {
  if (typeof dst != typeof src) return dst
  switch (true) {
    // Naive; do not do uniqueness
    case Array.isArray(src):
      for (let i = 0; i < src.length; i++)
        dst.push(src[i])
      break
    case typeof src == "object":
      for (let k of Object.keys(src)) {
        if (dst[k]) dst[k] = deepMerge(dst[k], src[k])
        else dst[k] = src[k]
      }
      break
    default:
      // replace dst leaf (string, number, bool etc.) with src's
      return src
  }
  return dst
}

// export const walk = (thing, f = (k, a) => a) => {
//   switch (true) {
//     case Array.isArray(thing):
//       for (let i = 0; i < thing.length; i++)
//         thing[i] = f(i, walk(thing[i], f))
//       break
//     case typeof thing == "object":
//       for (let k of Object.keys(thing))
//         thing[k] = f(k, walk(thing[k], f))
//       break
//   }
//   return thing
// }
