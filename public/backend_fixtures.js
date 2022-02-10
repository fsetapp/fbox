import { allSchs } from "../lib/project/store.js"
import * as T from "../lib/sch/type.js"
import { randInt } from "../lib/utils.js"

export { project }

const fmodelsFixture = (n, startId, opts) => {
  let fixture = []
  for (var i = 0; i < n; i++)
    fixture.push(allSchs[randInt(allSchs.length)])

  return fixture.map((sch, i) => {
    let fmodel = T.putAnchor(sch)

    fmodel.key = `model_${startId}_${fixture.length - i}`
    fmodel.isEntry = false
    fmodel.tag = T.FMODEL_TAG

    return fmodel
  })
}

let file_1_models = fmodelsFixture(10, 1)
let file_2_models = fmodelsFixture(1000, 11)
let file_3_models = fmodelsFixture(10, 21)

let folder_a = {
  ...T.putAnchor(T.folder),
  key: "folder_a",
}
let folder_b = {
  ...T.putAnchor(T.folder),
  key: "folder_b",
}
let folder_b1 = {
  ...T.putAnchor(T.folder),
  key: "folder_b1",
}
let folder_b2 = {
  ...T.putAnchor(T.folder),
  key: "folder_b2",
}

let b2_keep = folder_b2.fields[0]
folder_b2.fields = []

let files = [
  {
    ...T.putAnchor(T.file),
    key: "file_1",
    fields: file_1_models,
    lpath: [folder_a]
  },
  {
    ...T.putAnchor(T.file),
    key: "file_2",
    fields: file_2_models,
    lpath: [folder_b, folder_b1]
  },
  {
    ...T.putAnchor(T.file),
    key: "file_3",
    fields: file_3_models,
    lpath: []
  },
  {
    ...b2_keep,
    lpath: [folder_b, folder_b2]
  }
]

let project = {
  ...T.putAnchor(T.folder),
  key: "unclaimed_project",
  tag: "project",
  fields: files,
  currentFileKey: files[0].key
}
