// Constant value will not change forever.
import { putAnchor, TOPLV_TAG } from "./core.js"
import { s } from "./registry.js"
import { addFile, addFolder } from "../actions.js"
import { readable } from "../utils.js"

export const PKG_NAME = "proj"
export const MODULE = s({ PKG_NAME }).t

export const KEEP_EXT = 0
export const PROJECT = 1
export const FOLDER = 2

// Level concern tags
export const PROJECT_TAG = "project"
export const FILE_TAG = "file"
export const FOLDER_TAG = "folder"

export const file = (a, opts) => Object.assign({ m: MODULE, fields: [], tag: FILE_TAG }, a, opts)

export const project = (opts) => Object.assign(({ t: PROJECT, m: MODULE, fields: [], tag: PROJECT_TAG }), opts)
export const folder = (opts) => Object.assign(({ t: FOLDER, m: MODULE, fields: [putAnchor(keepFile)], tag: FOLDER_TAG }), opts)
export const keepFile = (opts) => file({ t: KEEP_EXT, key: "" }, opts)

/* Rule can be at
  1. component level when initialized
  2. parent level: apply to all children
  3. parent level: apply to specific child position (override 2.)
  4. itself level: apply to itself, and combined with 2. and 3. when itself is a child of of specified rule.
*/
const folderRule = () => ({
  children: {
    anyOf: [folder({ tag: FOLDER_TAG })],
    defaultSch: 1, // Model file
    put: { pos: "append" },
    keyScope: ["tag"]
  }
})

// extt is visual type extension that is used as return type of "function" (core language)
export const importDeps = imports => {
  const proj = imports.reduce((acc, pkg) => {
    const module = pkg.module
    const extt = s({ PKG_NAME: module.PKG_NAME }).t

    Object.assign(acc.tops, {
      [extt]: {
        self: { off: [addFile, addFolder] },
        children: { ...module.structSheet.tops, tag: TOPLV_TAG }
      }
    })
    acc.toStr[extt] = module.PKG_NAME
    acc.files.push(file({ t: extt }))

    return acc
  }, { tops: {}, toStr: {}, files: [] })

  let folderRule_ = folderRule()
  folderRule_.children.anyOf.splice(1, 0, ...proj.files)
  const sheet = {
    ...proj.tops,
    [PROJECT]: {
      children: folderRule_.children
    },
    [FOLDER]: folderRule_
  }

  return { [MODULE]: { sheet, toStr: proj.toStr } }
}
