import * as Sch from "../sch.js"
import * as T from "../sch/type.js"
import { writable } from "../utils.js"
import * as Actions from "../actions.js"

export const FILE_TAG = "file"
export const PROJECT_TAG = "project"

export const projectToStore = (project, store) => {
  Object.assign(store, project)

  for (let i = 0; i < project.fields.length; i++)
    store.fields[i] = fileToStore(project.fields[i], emptyFile(), store)

  writable(store, "schMetas", project.schMetas)
  return T.putAnchor(() => store)
}

const fileToStore = (file, store, projectStore) => {
  Object.assign(store, file)
  return T.putAnchor(() => store)
}


export const createProjectStore = () => createTreeStore({
  taggedLevel: { 1: PROJECT_TAG, 2: FILE_TAG, 3: T.FMODEL_TAG },
  allowedSchs: [emptyFile],
  put: {
    pos: "prepend",
    onlyDst: { [FILE_TAG]: true }
  }
})

const emptyFile = () =>
  createTreeStore({
    taggedLevel: { 1: FILE_TAG, 2: T.FMODEL_TAG },
    addDefault: T.record,
    entryable: [T.FMODEL_TAG],
    put: {
      pos: "prepend"
    },
    rulesTable: rulesTable
  })

const createTreeStore = (opts = {}) => {
  let s = T.putAnchor(T.record)
  s.allowedSchs = (opts.allowedSchs || allSchs).map(sch => sch())
  s.taggedLevel = opts.taggedLevel

  if (opts.put)
    s.put = opts.put

  if (opts.entryable)
    s.entryable = opts.entryable

  if (opts.addDefault)
    s._addSchDefault = s.allowedSchs.find(sch_ => sch_.type == opts.addDefault().type) && opts.addDefault()

  if (opts.rulesTable)
    s.rulesTable = opts.rulesTable

  return s
}

export const getFileStore = (projectStore, filename) => {
  let fileStore = Sch.get(projectStore, `[${filename}]`)
  if (fileStore)
    writable(fileStore, "schMetas", projectStore.schMetas)

  return fileStore
}

export const anchorsModels = (projectStore) => {
  let modelsAcc = {}
  walkFmodel(projectStore, (fmodel, m) => {
    modelsAcc[fmodel.$anchor] = { display: [m.file.key, fmodel.key].join(" :: "), file: m.file.key, fmodel: fmodel.key, type: fmodel.type }
  })
  return modelsAcc
}

//  Visit less numbers of nodes than Sch.walk (depth-first)
export const walkFmodel = (projectStore, fn) => {
  for (let file of projectStore.fields)
    for (let i = 0; i < file.fields.length; i++)
      file.fields[i] = fn(file.fields[i], { path: `[${file.key}][${file.fields[i].key}]`, file: file }) || file.fields[i]
}

export const allSchs = [
  T.string, T.record, T.list, T.tuple, T.union, T.any, T.bool, T.nil, () => T.value("\"json string\""),
  T.int8, T.int16, T.int32, T.uint8, T.uint16, T.uint32, T.float32, T.float64, T.timestamp,
  T.taggedUnion, T.dict
]

const dictRule = {
  selector: [["type", T.DICT]],
  rules: {
    self: {
      exceptActions: [Actions.addSch, Actions.paste]
    },
    children: {
      exceptActions: [Actions.cut, Actions.copy, Actions.cloneUp, Actions.cloneDown, Actions.deleteSelected, Actions.reorderUp, Actions.reorderDown]
    },
    nthChild: [
      {
        allowedSchs: [T.string()]
      }
    ]
  }
}
const tagUnionRule = {
  selector: [["type", T.TAGGED_UNION]],
  rules: {
    children: {
      allowedSchs: [T.record()]
    }
  }
}
export const rulesTable = [dictRule, tagUnionRule]
