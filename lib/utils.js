export const randInt = (max, min = 0) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min) + min)
}
export const jEQ = (obj1, obj2) => JSON.stringify(obj1) == JSON.stringify(obj2)
export const autoResize = (e) => {
  e.target.value = e.target.value.replace(/\n/g, "")
  e.target.style.overflow = "hidden"
  e.target.style.height = "auto"
  e.target.style.height = `${e.target.scrollHeight}px`
}
export const cursorEnd = (e) => {
  autoResize(e)
  e.target.setSelectionRange(e.target.value.length, e.target.value.length);
}

const { defineProperty } = Object
const def = defineProperty
export const readable = (o, k, v) => def(o, k, { value: v, configurable: true })
export const writable = (o, k, v) => def(o, k, { value: v, configurable: true, writable: true })

export const ffind = (collection, f) => {
  for (let i = 0; i < collection.length; i++)
    if (f(collection[i])) return collection[i]
    else continue
}
