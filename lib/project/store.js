import * as Sch from "../sch.js"

import { readable, reduce } from "../utils.js"
import { buildBaseIndices } from "../sch/diff.js"

import * as Core from "../pkgs/core.js"
import * as Proj from "../pkgs/proj.js"

const { putAnchor } = Core

export const projectToStore = (project, store) => {
  Object.assign(store, project)
  store.fields = []
  // for (let i = 0; i < project.fields.length; i++)
  //   store.fields[i] = fileToStore(project.fields[i], emptyFile(), store)

  return putAnchor(() => store)
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
    for (let fmodel of file.fields)
      if (referrers[fmodel.$a]) {
        let referrers_ = reduce(referrers[fmodel.$a], (acc, $a) => {
          if (lookup[$a]) acc.push(lookup[$a])
          return acc
        }, [])
        if (referrers_.length != 0) readable(fmodel, "referrers", referrers_)
        else delete fmodel.referrers
      }
      else delete fmodel.referrers
}

export const createProjectStore = ({ structSheet }) => createTreeStore({
  refParentLevel: 2,
  put: {
    pos: "prepend"
  },
  structSheet,
  entryable: [Core.TOPLV_TAG]
})

const createTreeStore = (opts = {}) => {
  let s = putAnchor(Proj.project)
  s.structSheet = opts.structSheet

  if (opts.put)
    s.put = opts.put

  if (opts.entryable)
    s.entryable = opts.entryable

  if (opts.refParentLevel)
    s.refParentLevel = opts.refParentLevel

  return s
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
      for (let i = 0; i < a.fields.length; i++)
        a.fields[i] = fn(a.fields[i], { path: `[${a.key}][${a.fields[i].key}]`, file: a }) || a.fields[i]

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
