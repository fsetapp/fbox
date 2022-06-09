import * as Sch from "../lib/sch.js"
import { TOPLV_TAG, putAnchor, ref } from "../lib/pkgs/core.js"
import { modelFile, htmlFile, jsonFile, folder, project as project_ } from "../lib/pkgs/proj.js"
import * as M from "../lib/pkgs/model.js"
import * as J from "../lib/pkgs/json.js"
import { randInt, reduce } from "../lib/utils.js"

import json from "./sample.json"

export { project }

const { structSheet: { toVal } } = M

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

const allTypesFixture = () => {
  let record = putAnchor(() => M.record({
    key: "Record", fields: [
      putAnchor(() => M.string({ key: "field_a" })),
      putAnchor(() => M.int32({ key: "field_b" }))
    ]
  }))
  let all = [
    M.record({
      key: "record", fields: [
        putAnchor(() => M.string({ key: "field_a" })),
        putAnchor(() => M.int32({ key: "field_b" }))
      ]
    }),
    M.erecord({
      key: "e_record", schs: [
        ref(record.$a),
        M.record({ fields: [M.bool({ key: "field_c" })] })
      ]
    }),
    M.list({ key: "list", sch: ref(record.$a) }),
    M.tuple({
      key: "tuple", schs: [
        toVal(M.string(), "\"ok\""),
        ref(record.$a),
      ]
    }),
    M.dict({
      key: "dict", schs: [
        putAnchor(M.string),
        ref(record.$a)
      ]
    }),
    M.taggedUnion({
      key: "tagged_union", schs: [
        M.record({
          fields: [
            M.uint8({ key: "field_x" })]
        }),
        M.record({
          fields: [
            M.string({ key: "field_z" })
          ]
        })
      ]
    }),
    M.union({ key: "union" }),
    M.union({
      key: "enum", schs: [
        toVal(M.string(), "\"item1\""),
        toVal(M.integer(), 1),
        toVal(M.bool(), true)
      ]
    }),
    M.string({ key: "string" }),
    M.bool({ key: "bool" }),
    M.int16({ key: "int16" }),
    M.float32({ key: "float32" }),
    ref(record.$a, { key: "ref" }),
  ]

  let tops = all.map(a => { a = Sch.copy(a); a.tag = TOPLV_TAG; return a })
  let fixtures = [...tops, M.record({ key: "Nested", fields: all })].map(a => Sch.clone(a))
  fixtures.unshift(record)
  return fixtures
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

let file_1_models = allTypesFixture()
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
