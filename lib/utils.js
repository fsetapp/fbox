export const randInt = (max, min = 0) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min)
}
export const jEQ = (obj1, obj2) => JSON.stringify(obj1) == JSON.stringify(obj2)
export const autoWidth = extra => e => {
  e.target.value = e.target.value.replace(/\n/g, "")
  e.target.style.maxWidth = `${e.target.value.length + 1 + extra}ch`
}
export const autoResize = (e) => {
  if (e.target.dataset?.newline == "false")
    e.target.value = e.target.value.replace(/\n/g, "")

  e.target.style.maxWidth = `${e.target.value.length + 1}ch`
  e.target.style.overflow = "hidden"
  e.target.style.height = "auto"
  e.target.style.height = `${e.target.scrollHeight}px`
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

export const reduce = (collection, f, acc) => {
  for (let i = 0; i < collection.length; i++)
    acc = f(acc, collection[i])

  return acc
}
