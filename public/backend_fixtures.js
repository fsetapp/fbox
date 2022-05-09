import { TOPLV_TAG, putAnchor } from "../lib/pkgs/core.js"
import { modelFile, htmlFile, jsonFile, folder, project as project_ } from "../lib/pkgs/proj.js"
import * as M from "../lib/pkgs/model.js"
import * as J from "../lib/pkgs/json.js"
import { randInt, reduce } from "../lib/utils.js"

import json from "./sample.json"

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

const jsonFixture = (json_) => {
  let sch
  switch (true) {
    case json_ == null: sch = J.nil(); break
    case typeof json_ == "string": sch = J.string({ v: json_ }); break
    case typeof json_ == "number": sch = J.number({ v: json_ }); break
    case typeof json_ == "boolean": sch = J.boolean({ v: json_ }); break
    case Array.isArray(json_):
      sch = J.array({
        schs:
          reduce(json_, (acc, item) => {
            acc.push(jsonFixture(item))
            return acc
          }, [])
      })
      break
    case typeof json_ == "object":
      sch = J.object({
        fields:
          reduce(Object.keys(json_), (acc, k) => {
            let sch_ = jsonFixture(json_[k])
            sch_.key = k
            acc.push(sch_)
            return acc
          }, [])
      })
      break
  }

  return putAnchor(() => sch)
}

let file_1_models = fmodelsFixture(10, 1)
let file_2_models = fmodelsFixture(1000, 11)
let file_3_models = fmodelsFixture(10, 21)
let file_4_json_toplv = jsonFixture(json)

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
  },
  {
    ...putAnchor(modelFile),
    key: "file_1",
    fields: file_1_models,
    lpath: [folder_a]
  },
  {
    ...putAnchor(htmlFile),
    key: "file_3",
    lpath: [folder_a]
  },
  {
    ...putAnchor(() => jsonFile({
      fields: [{ ...file_4_json_toplv, key: "entry", tag: TOPLV_TAG }]
    })),
    key: "file_4",
    lpath: [folder_a]
  }
]

let project = {
  ...putAnchor(project_),
  key: "unclaimed_project",
  fields: files,
  currentFileId: files[0].$a
}
