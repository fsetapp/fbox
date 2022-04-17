import { assert } from "@esm-bundle/chai";
import { VALUE } from "../lib/pkgs/model.js"
import { ref } from "../lib/pkgs/core.js"
import * as M from "../lib/pkgs/model.js"
import * as Sch from "../lib/sch.js"

it("#putAnchor to fmodel box", () => {
  var store = M.record()
  let tAny = M.any()
  Sch.put(store, "", [{ k: "abc", sch: () => tAny, index: 0 }, { k: "abc", sch: () => ref(tAny.$a), index: 1 }])

  for (let model of Object.keys(store.fields))
    assert.isOk(store.fields[model].$a)
})

it("#value invalid json", () => {
  assert.isNotOk(M.value("invalid"))
})

it("#value valid json", () => {
  assert.equal(M.value("\"valid\"").t, VALUE)
})

it("#value valid json but is denied", () => {
  assert.isNotOk(M.value("[1,2,3]"))
})
