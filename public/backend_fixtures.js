import * as Sch from "../lib/sch.js"
import { TOPLV_TAG, putAnchor, ref } from "../lib/pkgs/core.js"
import { file, folder, project as project_ } from "../lib/pkgs/proj.js"
import M, * as Model from "../lib/pkgs/model.js"
import * as J from "../lib/pkgs/json.js"
import * as H from "../lib/pkgs/html.js"
import { randInt, reduce } from "../lib/utils.js"
import json from "./sample.json"

export { project }

const { toVal } = Model

const modelFile = () => file({ t: Model.MODULE })
const htmlFile = () => file({ t: H.MODULE })
const jsonFile = opts => file({ t: J.MODULE }, opts)

const fmodelsFixture = (n, startId) => {
  const modelCtors = Object.values(Model.C)
  let fixture = []
  for (var i = 0; i < n; i++)
    fixture.push(modelCtors[randInt(modelCtors.length)])

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
  let record = M.record({
    key: "User", fields: [
      M.string({ key: "email" }),
      M.int32({ key: "age" })
    ]
  })
  // to give ids to all schs
  record = Sch.clone(record)
  // add "recur" field to point to itself
  let recur = putAnchor(() => ref(record.$a, { key: "recur" }))
  record.fields.unshift(recur)

  let all = [
    M.record({
      key: "Developer", fields: [
        M.string({ key: "username" }),
        M.int32({ key: "experience" }),
        ref(record.$a, { key: "info" }),
        M.record({
          key: "metadata", fields: [
            M.string({ key: "avatar_url" }),
            M.int32({ key: "internal_id" }),
          ]
        })
      ]
    }),
    M.e_record({
      key: "Editor", schs: [
        ref(record.$a),
        M.record({ fields: [M.bool({ key: "active" })] })
      ]
    }),
    M.list({ key: "User List", sch: ref(record.$a) }),
    M.list({ key: "User List Inline", sch: record }),
    M.tuple({
      key: "Result", schs: [
        toVal(M.string(), "\"ok\""),
        ref(record.$a),
      ]
    }),
    M.dict({
      key: "Role Users", schs: [
        putAnchor(M.string),
        ref(record.$a)
      ]
    }),
    M.tagged_union({
      key: "Role", tagname: "tag", fields: [
        M.record({
          fields: [
            M.uint8({ key: "developer" })]
        }),
        M.record({
          fields: [
            M.string({ key: "editor" })
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
    M.string({ key: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut mollis lorem ac turpis blandit volutpat. Praesent luctus dapibus pulvinar. Integer nec urna pretium, eleifend urna sed, euismod turpis. Quisque posuere interdum metus vitae rhoncus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Donec in ipsum ut augue vehicula pulvinar sit amet sit amet arcu. Morbi semper risus at neque malesuada laoreet" }),
    M.bool({ key: "online" }),
    M.int16({ key: "Number of item" }),
    M.float32({ key: "Percent" }),
    ref(record.$a, { key: "ref" }),
  ]

  let tops = all.map(a => { a = Sch.copy(a); a.tag = TOPLV_TAG; return a })
  // tops fixtures, plus the last one that wrap all the tops (without the tag)
  let fixtures = [...tops, M.record({ key: "Settings", fields: all })].map(a => Sch.clone(a))
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
