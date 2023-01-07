import * as Sch from "../sch.js"
import { forEach, reduce } from "../utils.js"

import * as Core from "../pkgs/core.js"
import * as Proj from "../pkgs/proj.js"
import { controller } from "../controllers/project.js"

export * as Indice from "./store/indice.js"
export * as Pull from "./store/pull.js"
const { assign } = Object

export const fromProject = (project, { imports }) => {
  let imports_ = [...imports]
  let conf = {
    structSheet: {},
    controllers: {},
    elements: {},
    diffableActs: {},
    refParentLevel: 2,
    entryable: [Core.TOPLV_TAG]
  }

  imports_.push({
    deps: Proj.importDeps(imports),
    controller: { [Proj.PROJECT_TAG]: controller }
  })
  reduce(imports_, (acc, pkg) => {
    assign(acc.structSheet, pkg.deps)
    assign(acc.controllers, pkg.controller)
    assign(acc.elements, pkg.elements)
    assign(acc.diffableActs, pkg.diffableActs)
    return acc
  }, conf)

  let store = Core.putAnchor(() => Proj.project(conf))
  return assign(store, project)
}

export const getFileStore = (projectStore, path) =>
  Sch.get(projectStore, path)

export const buildFolderTree = (projectStore) => {
  let files = projectStore.fields.splice(0)

  let lpathList = files.map(file => {
    let { lpath, ...file_ } = file
    lpath ||= []
    file_.tag = Proj.FILE_TAG
    // Backward compat just in case
    forEach(file_.fields, (a, i) => a.tag = Core.TOPLV_TAG)
    // Defensive code for inaccurate persisted lpath, l.fields should be empty
    forEach(lpath, l => l.fields = [])

    lpath.unshift(projectStore)
    lpath.push(file_)
    return lpath
  })
  groupByLevel(lpathList)
}
/*
  [
    ["a", "b", 1],
    ["a", "b", 2],
  ]
  memo[current.$a] is saved parent pushing more children in {$a: "a", fields: []}
  memo[next.$a] is saved child not pushing "b" more than once
 */
const groupByLevel = (lpathList) => {
  let memo = {}

  for (let lpath of lpathList)
    forEach(lpath, (current, i) => {
      let next = lpath[i + 1]
      if (next) {
        current = memo[current.$a] || current
        current.fields ||= []

        memo[next.$a] || current.fields.push(next)
        memo[current.$a] = current
      }
    })
}
