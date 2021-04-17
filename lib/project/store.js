import * as Sch from "../sch.js"
import * as T from "../sch/type.js"

export const FILE_TAG = "file"
export const PROJECT_TAG = "project"

export const projectToStore = (project, store) => {
  Object.assign(store, project)
  store.entrypoints = {}

  let keys = Object.keys(project.fields)
  for (let i = 0; i < keys.length; i++)
    store.fields[keys[i]] = fileToStore(project.fields[keys[i]], emptyFile(), store)

  return T.putAnchor(() => store)
}

const fileToStore = (file, store, projectStore) => {
  Object.assign(store, file)
  return T.putAnchor(() => store)
}


export const createProjectStore = () => createTreeStore({
  taggedLevel: { 1: PROJECT_TAG, 2: FILE_TAG, 3: T.FMODEL_TAG },
  allowedSchs: [emptyFile()],
  put: {
    pos: "prepend",
    onlyDst: { [FILE_TAG]: true }
  }
})

const emptyFile = () =>
  createTreeStore({
    taggedLevel: { 1: FILE_TAG, 2: T.FMODEL_TAG },
    addDefault: () => createTreeStore(),
    entryable: [T.FMODEL_TAG]
  })

// TODO: use defineProperties to exclude client-only props, make them non-enumerable,
// be excluded from serialization process.
const createTreeStore = (opts = {}) => {
  let s = T.putAnchor(T.record)
  s.taggedLevel = opts.taggedLevel
  s.allowedSchs = opts.allowedSchs || allSchs.map(sch => sch())

  if (opts.addDefault) s._addSchDefault = s.allowedSchs.find(sch_ => sch_.type == opts.addDefault().type) && opts.addDefault()
  if (opts.put) s.put = opts.put
  if (opts.entryable) s.entryable = opts.entryable
  return s
}

export const getFileStore = (projectStore, filename) => {
  let fileStore = Sch.get(projectStore, `[${filename}]`)
  if (fileStore) {
    fileStore.schMetas ||= {}
    fileStore.schMetas = projectStore.schMetas
  }
  return fileStore
}

export const anchorsModels = (projectStore, fileStore) => {
  let modelsAcc = {}
  for (let filename of projectStore.order) {
    let file = projectStore.fields[filename]

    for (let modelname of file.order)
      modelsAcc[file.fields[modelname].$anchor] = filename != fileStore.key ? `${filename}.${modelname}` : modelname
  }
  return modelsAcc
}

export const allSchs = [T.string, T.record, T.list, T.tuple, T.union, T.any, T.bool, T.number, T.nil, () => T.value("\"json string\"")]
