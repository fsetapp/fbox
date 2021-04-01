import { allSchs } from "../lib/main.js"
import * as T from "../lib/sch/type.js"
import { randInt } from "../lib/utils.js"

export { project }

const fmodelsFixture = (n, startId, opts) => {
  let fixture = []
  for (var i = 0; i < n; i++)
    fixture.push(allSchs[randInt(allSchs.length)])

  return fixture.map((sch, i) => {
    let fmodel = {
      id: startId + i,
      key: `model_${startId}_${fixture.length - i}`,
      sch: Object.assign(T.putAnchor(sch))
    }

    Object.assign(fmodel, {
      anchor: fmodel.sch.$anchor,
      type: fmodel.sch.type,
      isEntry: false,
    })

    return Object.assign(fmodel, opts)
  })
}

let file_1_models = fmodelsFixture(10, 1, { file_id: 1 })
let file_1 = {
  id: 1,
  key: "file_1",
  project_id: 1,
  order: file_1_models.map(m => m.key),
  fmodels: file_1_models
}
let file_2_models = fmodelsFixture(1000, 11, { file_id: 2 })
let file_2 = {
  id: 2,
  key: "file_2",
  project_id: 1,
  order: file_2_models.map(m => m.key),
  fmodels: file_2_models
}
let file_3_models = fmodelsFixture(10, 21, { file_id: 3 })
let file_3 = {
  id: 3,
  key: "file_3",
  project_id: 1,
  order: file_3_models.map(m => m.key),
  fmodels: file_3_models
}

const project = {
  id: 1,
  key: "unclaimed_project",
  files: [file_1, file_2, file_3],
  order: ["file_1", "file_2", "file_3"],
  entry_points: [{ id: 1, key: "model_1" }],
  current_file: 1
}
