import { TOPLV_TAG, putAnchor } from "../lib/pkgs/core.js"

import { modelFile, htmlFile, dataFile, folder, project as project_ } from "../lib/pkgs/proj.js"
import * as M from "../lib/pkgs/model.js"
import { s } from "../lib/pkgs/registry.js"

import { randInt } from "../lib/utils.js"

export { project }

const fmodelsFixture = (n, startId) => {
  let fixture = []
  for (var i = 0; i < n; i++)
    fixture.push(M.all[randInt(M.all.length)])

  return fixture.map((sch, i) => {
    let fmodel = putAnchor(sch)

    // fmodel.t = [s(M), fmodel.t]
    fmodel.key = `model_${startId}_${fixture.length - i}`
    fmodel.isEntry = false
    fmodel.tag = TOPLV_TAG

    return fmodel
  })
}

const dataFixture = (n) => {

}

let file_1_models = fmodelsFixture(10, 1)
let file_2_models = fmodelsFixture(1000, 11)
let file_3_models = fmodelsFixture(10, 21)
let file_2_data = dataFixture(10)

let folder_a = {
  ...putAnchor(folder),
  key: "folder_a",
}
let folder_b = {
  ...putAnchor(folder),
  key: "folder_b",
}
let folder_b1 = {
  ...putAnchor(folder),
  key: "folder_b1",
}
let folder_b2 = {
  ...putAnchor(folder),
  key: "folder_b2",
}

let b2_keep = folder_b2.fields[0]
folder_b2.fields = []

let files = [
  {
    ...putAnchor(modelFile),
    key: "file_1",
    fields: file_1_models,
    lpath: [folder_a]
  },
  {
    ...putAnchor(dataFile),
    key: "file_2",
    fields: [],
    lpath: [folder_a]
  },
  {
    ...putAnchor(htmlFile),
    key: "file_3",
    lpath: [folder_a]
  },
  {
    ...putAnchor(modelFile),
    key: "file_2",
    fields: file_2_models,
    lpath: [folder_b, folder_b1]
  },
  {
    ...putAnchor(modelFile),
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
  ...putAnchor(project_),
  key: "unclaimed_project",
  fields: files,
  currentFileId: files[0].$a
}
