// Could move data to external (e.g. https://cdn.registry._.com)
const data = {
  core: { t: 1 },
  proj: { t: 2 },
  model: { t: 3 },
  form: { t: 4 },
  html: { t: 5 },
  json: { t: 6 },
  sheet: { t: 7 }
}

const symLookup = Object.defineProperties({}, Object.entries(data)
  .reduce((acc, [k, v]) => { acc[k] = { value: v, writable: false }; return acc }, {}))

export const s = module => {
  const pkg = symLookup[module.PKG_NAME]
  if (pkg) return pkg
  throw module
}
