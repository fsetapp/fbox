import * as Sch from "../sch.js"
import { forEach } from "../utils.js"

import * as Core from "../pkgs/core.js"
import * as Proj from "../pkgs/proj.js"
import { s } from "../pkgs/registry.js"
import { preCompileCheck } from "../actions.js"

export * as Indice from "./store/indice.js"
export * as Pull from "./store/pull.js"

export const fromProject = (project, params) => {
  let store = createProjectStore(params)
  Object.assign(store, project)
  store.fields = []

  return store
}

const createProjectStore = ({ structSheet }) => {
  let project = Core.putAnchor(Proj.project)
  Object.assign(structSheet, {
    [s(Core).t]: Core.structSheet,
    [s(Proj).t]: Proj.structSheet
  })

  return Object.assign(project, {
    refParentLevel: 2,
    structSheet,
    entryable: [Core.TOPLV_TAG]
  })
}

export const getFileStore = (projectStore, path) =>
  Sch.get(projectStore, path)

export const buildFolderTree = (projectStore) => {
  let files = projectStore.fields.splice(0)

  let lpathList = files.map(file => {
    let { lpath, ...file_ } = file
    Object.assign(file_, { tag: Proj.FILE_TAG })
    // Backward compat just in case
    forEach(file_.fields, (a, i) => Object.assign(a, { tag: Core.TOPLV_TAG }))

    lpath ||= []
    lpath.unshift(projectStore)
    lpath.push(file_)
    return lpath
  })
  groupByLevel(lpathList)
}
const groupByLevel = (lpathList) => {
  let memo = {}

  for (let lpath of lpathList)
    for (let i = 0; i < lpath.length; i++) {
      let current = lpath[i]
      let next = lpath[i + 1]
      if (!next) continue

      current = memo[current.$a] || current
      current.fields ||= []

      if (current.$a == next.$a) continue // monkey patch
      memo[next.$a] || current.fields.push(next)

      memo[current.$a] = current
    }
}
