import { s } from "../pkgs/registry.js"
import { putAnchor } from "../pkgs/core.js"

export const maybeStandAlone = (store, extt, conf) => {
  const anonProj = "proj"
  const { structSheet, extSheet } = conf

  if (!store) {
    store = putAnchor(() => Object.assign(({ t: extt, m: anonProj, fields: [], tag: "file" })))
    Object.assign(structSheet, { [anonProj]: { sheet: extSheet, toStr: {} } })
  }

  store.structSheet ||= structSheet
  return store
}
