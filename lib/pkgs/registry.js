const frozen = val => ({ value: val, writable: false })

const symLookup = Object.defineProperties({},
  {
    "core": frozen({ t: 1 }),
    "proj": frozen({ t: 2 }),
    "model": frozen({ t: 3 }),
    "form": frozen({ t: 4 }),
    "html": frozen({ t: 5 }),
    "json": frozen({ t: 6 })
  })

export const s = module => {
  const pkg = symLookup[module.PKG_NAME]
  if (pkg) return pkg
  throw module
}
