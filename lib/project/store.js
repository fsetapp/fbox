import * as Sch from "../sch.js"

import { readable, reduce, forEach } from "../utils.js"
import { buildBaseIndices } from "../sch/diff.js"

import * as Core from "../pkgs/core.js"
import * as Proj from "../pkgs/proj.js"
import { s } from "../pkgs/registry.js"

const { putAnchor } = Core

export const projectToStore = (project, params) => {
  let store = createProjectStore(params)
  Object.assign(store, project)
  store.fields = []

  return store
}

export const mergeSchMetas = (projectStore, schMetas) =>
  Sch.walk(projectStore, (a, m) => {
    if (schMetas[a.$a])
      a.metadata = schMetas[a.$a]
    return a
  })

export const mergeReferrers = (projectStore, referrers) => {
  buildBaseIndices(projectStore)
  let lookup = projectStore._indices

  for (let file of projectStore.fields)
    for (let toplv of file.fields)
      if (referrers[toplv.$a]) {
        let referrers_ = reduce(referrers[toplv.$a], (acc, $a) => {
          if (lookup[$a]) acc.push(lookup[$a])
          return acc
        }, [])
        if (referrers_.length != 0) readable(toplv, "referrers", referrers_)
        else delete toplv.referrers
      }
      else delete toplv.referrers
}

const createProjectStore = ({ structSheet }) => {
  let project = putAnchor(Proj.project)
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

export const getFileStore = (projectStore, target) => {
  let path = target.id
  let fileStore

  if (target.dataset?.tag == Proj.FILE_TAG)
    fileStore = target
  else
    fileStore = Sch.get(projectStore, path) || projectStore._currentFileStore

  return fileStore
}

export const anchorsModels = (projectStore) => {
  let modelsAcc = {}
  walkFmodel(projectStore, (fmodel, m) => {
    modelsAcc[fmodel.$a] = { display: [m.file.key, fmodel.key].join(" :: "), file: m.file.key, fmodel: fmodel.key, sch: fmodel }
  })
  return modelsAcc
}

//  Visit less numbers of nodes than Sch.walk (depth-first)
export const walkFmodel = (projectStore, fn) =>
  Sch.walk(projectStore, (a, m) => {
    if (a.tag == Proj.FILE_TAG) {
      forEach(a.fields, (toplv) => {
        toplv = fn(toplv, { path: `[${a.key}][${toplv.key}]`, file: a }) || toplv
      })
      readable(a, "_pruned", true)
    }
    return a
  })

export const buildFolderTree = (projectStore) => {
  let files = projectStore.fields.splice(0)

  let lpathList = files.map(file => {
    let { lpath, ...file_ } = file
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
      memo[next.$a] || current.fields.push(next)

      memo[current.$a] = current
    }
}
export const walkFile = (projectStore, fn) =>
  Sch.walk(projectStore, (a, m) => {
    if (a.tag == Proj.FILE_TAG) {
      a = fn(a, m)
      readable(a, "_pruned", true)
    }
    return a
  })
