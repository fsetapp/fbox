// Constant value will not change forever.
import * as Actions from "../actions.js"
import { putAnchor, TOPLV_TAG } from "./core.js"
import * as Model from "./model.js"
import * as Form from "./form.js"
import * as Json from "./json.js"
import * as Html from "./html.js"
import { s } from "./registry.js"

export const PKG_NAME = "proj"

/* Modules. Non-t constants. Use with FILE.
  an ext is a module of fset-lang but can also generates some standard format
  such as:
  - JSON Schema (MODEL_EXT)
  - JSON (JSON_EXT)
  - HTML (HTML_EXT)
  - JSON Schema & JSON (JSON_DATA_EXT)

  As this written time, we are not creating a programming language
  since it's a full-blown effort. Our focus right now is around editing standard file format.
  We store "source code" as AST, basically skip lexer and parser and go straight to elaboration and evaluation phrase.
*/
export const EXT = s({ PKG_NAME }).t
export const KEEP_EXT = 0
export const HTML_EXT = s(Html).t
export const MODEL_EXT = s(Model).t
export const JSON_DATA_EXT = s(Form).t
export const JSON_EXT = s(Json).t

// Level concern tags
export const PROJECT_TAG = "project"
export const FILE_TAG = "file"
export const FOLDER_TAG = "folder"

export const PROJECT = 0
export const FILE = 1
export const FOLDER = 2

const { assign } = Object
export const project = (opts) => assign(({ t: PROJECT, fields: [], ext: EXT, tag: PROJECT_TAG }), opts)
export const file = (opts) => assign(({ t: FILE, fields: [], tag: FILE_TAG }), opts)
export const folder = (opts) => assign(({ t: FOLDER, fields: [putAnchor(() => file({ ext: KEEP_EXT }))] }), opts)

/* Rule can be at
  1. component level when initialized
  2. parent level: apply to all children
  3. parent level: apply to specific child position (override 2.)
  4. itself level: apply to itself, and combined with 2. and 3. when itself is a child of of specified rule.
*/
const folderRule = {
  selector: [["t", FOLDER]],
  rules: {
    children: {
      allowedSchs: [
        folder({ tag: FOLDER_TAG }),
        file({ ext: MODEL_EXT }),
        file({ ext: JSON_DATA_EXT }),
        file({ ext: HTML_EXT })
      ],
      defaultSch: 1 // Model file
    }
  }
}
const sheet = [
  {
    selector: [["t", PROJECT]],
    rules: {
      self: {
        tag: PROJECT_TAG
      },
      children: folderRule.rules.children
    }
  },
  folderRule,
  {
    selector: [["t", FILE], ["ext", MODEL_EXT]],
    rules: {
      self: {
        exceptActions: [Actions.addFile, Actions.addFolder],
        tag: FILE_TAG // Used for tagged_diff; new file gets tag added automatically
      },
      children: {
        tag: TOPLV_TAG, // Used for tagged_diff
        allowedSchs: Model.tops,
        defaultSch: 1 // somehow config here is ignored, the select: true inside model.js is applied instead
      }
    }
  },
  {
    selector: [["t", FILE], ["ext", JSON_DATA_EXT]],
    rules: {
      children: {
        allowedSchs: Form.tops
      }
    }
  },
  {
    selector: [["t", FILE], ["ext", HTML_EXT]],
    rules: {
      children: {
        allowedSchs: Html.tops
      }
    }
  },
]

const toStr = {}

export const structSheet = { sheet, toStr }
