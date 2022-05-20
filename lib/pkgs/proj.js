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
export const SHEET_EXT = 7

// Level concern tags
export const PROJECT_TAG = "project"
export const FILE_TAG = "file"
export const FOLDER_TAG = "folder"

const file = (a, opts) => Object.assign({ m: MODULE, fields: [], tag: FILE_TAG }, a, opts)

export const project = (opts) => Object.assign(({ t: PROJECT, m: MODULE, fields: [], tag: PROJECT_TAG }), opts)
export const folder = (opts) => Object.assign(({ t: FOLDER, m: MODULE, fields: [putAnchor(keepFile)], tag: FOLDER_TAG }), opts)
export const keepFile = (opts) => file({ t: KEEP_EXT, key: "" }, opts)
export const modelFile = (opts) => file({ t: MODEL_EXT }, opts)
export const htmlFile = (opts) => file({ t: HTML_EXT }, opts)
export const jsonFile = (opts) => file({ t: JSON_EXT }, opts)
export const sheetFile = (opts) => file({ t: SHEET_EXT }, opts)

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
      sheetFile(),
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
  [SHEET_EXT]: "sheet",
  [HTML_EXT]: "html"
}

export const structSheet = { sheet, toStr }
