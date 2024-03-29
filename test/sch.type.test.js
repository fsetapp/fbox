import { assert } from "@esm-bundle/chai";
import { ref } from "../lib/pkgs/core.js"
import * as M from "../lib/pkgs/model.js"
import * as Sch from "../lib/sch.js"

const { toVal } = M.structSheet

it("#putAnchor to fmodel box", () => {
  var store = M.record()
  let tString = M.string()
  Sch.put(store, "", [{ k: "abc", sch: () => tString, index: 0 }, { k: "abc", sch: () => ref(tString.$a), index: 1 }])

  for (let model of Object.keys(store.fields))
    assert.isOk(store.fields[model].$a)
})

// Use case: using M.toVal inside another X.toVal where it requires casting success all the time.
// So we just coerce its box to be its value type.
it("#toVal mismatch type and casting value resulting in value typed box", () => {
  assert.equal(toVal(M.integer(), "string").t, M.STRING)
})

it("#toVal valid json", () => {
  assert.equal(toVal(M.integer(), 123).t, M.INTEGER)
})

it("#toVal valid json but is denied", () => {
  assert.isNotOk(toVal(M.list(), "[1,2,3]"))
})
