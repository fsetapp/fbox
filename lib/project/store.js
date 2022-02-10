import * as Sch from "../sch.js"
import * as T from "../sch/type.js"
import * as Actions from "../actions.js"
import { readable, reduce } from "../utils.js"
import { buildBaseIndices } from "../sch/diff.js"

export const FILE_TAG = "file"
export const PROJECT_TAG = "project"

export const projectToStore = (project, store) => {
  Object.assign(store, project)
  store.fields = []
  // for (let i = 0; i < project.fields.length; i++)
  //   store.fields[i] = fileToStore(project.fields[i], emptyFile(), store)

  return T.putAnchor(() => store)
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

export const fileToStore = (file, store, projectStore) => {
  store ||= emptyFile()

  switch (file.t) {
    case T.FILE:
      Object.assign(store, file)
      return T.putAnchor(() => store)
    case T.FOLDER:
      return T.putAnchor(() => file)
  }
}

export const createProjectStore = () => createTreeStore({
  taggedLevel: { 1: PROJECT_TAG, 2: FILE_TAG, 3: T.FMODEL_TAG },
  refParentLevel: 2,
  allowedSchs: [emptyFile],
  put: {
    pos: "prepend"
  },
  structSheet: structSheet
})

const emptyFile = () =>
  createTreeStore({
    taggedLevel: { 1: FILE_TAG, 2: T.FMODEL_TAG },
    refParentLevel: 1,
    addDefault: T.record,
    entryable: [T.FMODEL_TAG],
    put: {
      pos: "prepend"
    }
  })

const createTreeStore = (opts = {}) => {
  let s = T.putAnchor(T.record)
  // s.allowedSchs = (opts.allowedSchs || allSchs).map(sch => sch())
  s.taggedLevel = opts.taggedLevel

  if (opts.put)
    s.put = opts.put

  if (opts.entryable)
    s.entryable = opts.entryable

  // if (opts.addDefault)
  //   s._addSchDefault = s.allowedSchs.find(sch_ => sch_.t == opts.addDefault().t) && opts.addDefault()

  if (opts.structSheet)
    s.structSheet = opts.structSheet

  if (opts.refParentLevel)
    s.refParentLevel = opts.refParentLevel

  return s
}

export const getFileStore = (projectStore, filename, target) => {
  let path = target?.id || `[${filename}]`
  let fileStore = Sch.get(projectStore, path) || projectStore._currentFileStore

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
    if (a.t == T.FILE) {
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
    if (a.t == T.FILE) {
      a = fn(a, m)
      readable(a, "_pruned", true)
    }
    return a
  })

export const allSchs = [
  T.string, T.record, T.list, T.tuple, T.union, T.any, T.bool, T.nil, () => T.value("\"json string\""),
  T.integer, T.int8, T.int16, T.int32, T.uint8, T.uint16, T.uint32, T.float32, T.float64,
  T.taggedUnion, T.dict, T.erecord, () => T.ref(null)
]

/* Rule can be at
  1. component level when initialized
  2. parent level: apply to all children
  3. parent level: apply to specific child position (override 2.)
  4. itself level: apply to itself, and combined with 2. and 3. when itself is a child of of specified rule.
*/
const dictRule = {
  selector: [["t", T.DICT]],
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
const erecordRule = {
  selector: [["t", T.E_RECORD]],
  rules: {
    self: {
      exceptActions: [Actions.addSch, Actions.paste]
    },
    children: {
      exceptActions: [Actions.cut, Actions.copy, Actions.cloneUp, Actions.cloneDown, Actions.deleteSelected, Actions.reorderUp, Actions.reorderDown]
    },
    nthChild: [
      { allowedSchs: [T.ref(null, { to: [T.record({ metadata: { strict: false } })] })] },
      { allowedSchs: [T.record()], exceptActions: [Actions.activateEditType, Actions.submitEdit] }
    ]
  }
}
const tagUnionRule = {
  selector: [["t", T.TAGGED_UNION]],
  rules: {
    children: {
      min: 1,
      allowedSchs: [T.record(), T.ref(null, { to: [T.record()] })]
    }
  }
}
const folderRule = {
  selector: [["t", T.FOLDER]],
  rules: {
    children: {
      allowedSchs: [
        fileToStore(T.file({ ext: T.MODEL_EXT })),
        fileToStore(T.file({ ext: T.JSON_EXT })),
        T.folder({ tag: "folder" })
      ]
    }
  }
}
const projectRule = {
  selector: [["t", T.PROJECT]],
  rules: folderRule.rules
}
const fileRule = {
  selector: [["t", T.FILE]],
  rules: {
    self: {
      exceptActions: [Actions.addFile, Actions.addFolder],
      tag: FILE_TAG
    },
    children: {
      tag: T.FMODEL_TAG,
      allowedSchs: allSchs.map(sch => ({ ...sch(), tag: T.FMODEL_TAG })),
      defaultSch: 1
    }
  }
}
const catchAll = {
  selector: true,
  rules: {
    children: {
      allowedSchs: allSchs.map(sch => sch())
    }
  }
}

export const structSheet = [projectRule, folderRule, fileRule, dictRule, tagUnionRule, erecordRule, catchAll]
