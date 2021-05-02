import * as Sch from "../sch.js"
import * as T from "../sch/type.js"
import { readable, writable } from "../utils.js"

export const FILE_TAG = "file"
export const PROJECT_TAG = "project"

export const projectToStore = (project, store) => {
  Object.assign(store, project)

  for (let i = 0; i < project.fields.length; i++)
    store.fields[i] = fileToStore(project.fields[i], emptyFile(), store)

  writable(store, "schMetas", {})
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
    }
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
    modelsAcc[fmodel.$anchor] = { display: [m.file.key, fmodel.key].join(" :: "), file: m.file.key, fmodel: fmodel.key }
  })
  return modelsAcc
}

//  Visit less numbers of nodes than Sch.walk (depth-first)
export const walkFmodel = (projectStore, fn) => {
  for (let file of projectStore.fields)
    for (let i = 0; i < file.fields.length; i++)
      file.fields[i] = fn(file.fields[i], { path: `[${file.key}][${file.fields[i].key}]`, file: file }) || file.fields[i]
}

export const allSchs = [T.string, T.record, T.list, T.tuple, T.union, T.any, T.bool, T.number, T.nil, () => T.value("\"json string\"")]
