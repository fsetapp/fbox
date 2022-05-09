// Constant value will not change forever.
import { putAnchor } from "./core.js"
import { s } from "./registry.js"

export const PKG_NAME = "proj"
const MODULE = s({ PKG_NAME }).t

export const KEEP_EXT = 0
export const PROJECT = 1
export const FOLDER = 2
export const HTML_EXT = 3
export const MODEL_EXT = 4
export const JSON_EXT = 6

// Level concern tags
export const PROJECT_TAG = "project"
export const FILE_TAG = "file"
export const FOLDER_TAG = "folder"

const { assign } = Object
export const project = (opts) => assign(({ t: PROJECT, m: MODULE, fields: [], tag: PROJECT_TAG }), opts)
export const folder = (opts) => assign(({ t: FOLDER, m: MODULE, fields: [putAnchor(keepFile)], tag: FOLDER_TAG }), opts)
export const keepFile = (opts) => assign(({ t: KEEP_EXT, m: MODULE, key: "", fields: [], tag: FILE_TAG }), opts)
export const modelFile = (opts) => assign(({ t: MODEL_EXT, m: MODULE, fields: [], tag: FILE_TAG }), opts)
export const htmlFile = (opts) => assign(({ t: HTML_EXT, m: MODULE, fields: [], tag: FILE_TAG }), opts)
export const jsonFile = (opts) => assign(({ t: JSON_EXT, m: MODULE, fields: [], tag: FILE_TAG }), opts)

/* Rule can be at
  1. component level when initialized
  2. parent level: apply to all children
  3. parent level: apply to specific child position (override 2.)
  4. itself level: apply to itself, and combined with 2. and 3. when itself is a child of of specified rule.
*/
const folderRule = {
  children: {
    allowedSchs: [
      folder({ tag: FOLDER_TAG }),
      modelFile(),
      htmlFile(),
      jsonFile(),
    ],
    defaultSch: 1, // Model file
    put: { pos: "append" },
    keyScope: ["tag"]
  }
}
const sheet = {
  [PROJECT]: {
    children: folderRule.children
  },
  [FOLDER]: folderRule
}

const toStr = {
  [MODEL_EXT]: "fmodel",
  [JSON_EXT]: "json",
  [HTML_EXT]: "html"
}

export const structSheet = { sheet, toStr }
