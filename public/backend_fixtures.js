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
let files = [{
  ...T.putAnchor(T.folder),
  key: "folder_a",
  fields: [{
    ...T.putAnchor(T.file),
    key: "file_1",
    tag: "file",
    fields: file_1_models
  }]
},
{
  ...T.putAnchor(T.folder),
  key: "folder_b",
  fields: [{
    ...T.putAnchor(T.folder),
    key: "folder_b1",
    fields: [{
      ...T.putAnchor(T.file),
      key: "file_2",
      tag: "file",
      fields: file_2_models
    }]
  }]
},
{
  ...T.putAnchor(T.file),
  key: "file_3",
  tag: "file",
  fields: file_3_models
}]

const project = {
  ...T.putAnchor(T.folder),
  key: "unclaimed_project",
  tag: "project",
  fields: files,
  currentFileKey: files[0].key
}
