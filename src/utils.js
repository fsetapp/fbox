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
