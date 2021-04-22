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

    return fmodel
  })
}

let file_1_models = fmodelsFixture(10, 1)
let file_2_models = fmodelsFixture(1000, 11)
let file_3_models = fmodelsFixture(10, 21)
let files = [
  {
    ...T.putAnchor(T.record),
    key: "file_1",
    fields: file_1_models
  },
  {
    ...T.putAnchor(T.record),
    key: "file_2",
    fields: file_2_models
  },
  {
    ...T.putAnchor(T.record),
    key: "file_3",
    fields: file_3_models
  }
]

const project = {
  ...T.putAnchor(T.record),
  key: "unclaimed_project",
  fields: files,
  schMetas: {},
  currentFileKey: files[0].key
}
