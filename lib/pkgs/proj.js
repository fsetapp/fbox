// Constant value will not change forever.
import * as Actions from "../actions.js"
import { putAnchor, TOPLV_TAG } from "./core.js"
import * as Model from "./model.js"
import * as Form from "./form.js"
import * as Json from "./json.js"
import * as Html from "./html.js"
import { s } from "./registry.js"

export const PKG_NAME = "proj"
const MODULE = s({ PKG_NAME }).t

/* Modules. Non-t constants. Use with FILE.
  an ext generates some standard format
  such as:
  - JSON Schema (MODEL_EXT)
  - JSON (JSON_EXT)
  - HTML (HTML_EXT)
  - JSON Schema & JSON (JSON_DATA_EXT)

  As this written time, we are not creating a programming language
  since it's a full-blown effort. Our focus right now is around editing standard file format.
  We store "source code" as AST, basically skip lexer and parser and go straight to elaboration and evaluation phrase.
*/
export const KEEP_EXT = 0
export const PROJECT = 1
export const FOLDER = 2
export const HTML_EXT = 3
export const MODEL_EXT = 4
export const JSON_DATA_EXT = 5
export const JSON_EXT = 6

// Level concern tags
export const PROJECT_TAG = "project"
export const FILE_TAG = "file"
export const FOLDER_TAG = "folder"

const { assign } = Object
export const project = (opts) => assign(({ t: PROJECT, m: MODULE, fields: [], tag: PROJECT_TAG }), opts)
export const folder = (opts) => assign(({ t: FOLDER, m: MODULE, fields: [putAnchor(keepFile)] }), opts)
export const keepFile = (opts) => assign(({ t: KEEP_EXT, m: MODULE, fields: [], tag: FILE_TAG }), opts)
export const modelFile = (opts) => assign(({ t: MODEL_EXT, m: MODULE, fields: [], tag: FILE_TAG }), opts)
export const dataFile = (opts) => assign(({ t: JSON_DATA_EXT, m: MODULE, fields: [], tag: FILE_TAG }), opts)
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
      dataFile(),
      htmlFile(),
      jsonFile(),
    ],
    defaultSch: 1 // Model file
  }
}
const sheet = t => lookup[t] || lookup["default"]
const lookup = {
  [PROJECT]: {
    children: folderRule.children
  },
  [FOLDER]: folderRule,
  [MODEL_EXT]: {
    self: {
      exceptActions: [Actions.addFile, Actions.addFolder, Actions.paste]
    },
    children: {
      tag: TOPLV_TAG, // Used for tagged_diff
      // allowedSchs here is equivalent to "import" in programming term
      // It may import multiple package to accomplish json schema output
      // In fact, Model package already import one Core's symbol (ref)
      allowedSchs: Model.tops,
      defaultSch: 1 // somehow config here is ignored, the select: true inside model.js is applied instead
    }
  },
  [JSON_DATA_EXT]: {
    self: {
      exceptActions: [Actions.addFile, Actions.addFolder, Actions.paste]
    },
    children: {
      tag: TOPLV_TAG, // requried
      allowedSchs: Form.tops
    }
  },
  [JSON_EXT]: {
    self: {
      exceptActions: [Actions.addFile, Actions.addFolder, Actions.paste]
    },
    children: {
      tag: TOPLV_TAG, // requried
      allowedSchs: Json.tops,
      n: 1
    }
  },
  [HTML_EXT]: {
    self: {
      exceptActions: [Actions.addFile, Actions.addFolder, Actions.paste]
    },
    children: {
      tag: TOPLV_TAG, // required
      allowedSchs: Html.tops
    }
  },
}

const toStr = {}

export const structSheet = { sheet, toStr }
