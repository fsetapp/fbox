import { assert } from "@esm-bundle/chai";
import * as T from "../sch/type.js"
import * as Sch from "../sch.js"

it("#putAnchor to fmodel box", () => {
  var store = { ...T.record(), _box: T.FMODEL_BOX }
  let tAny = T.any()
  Sch.put(store, "", [{ k: "abc", sch: () => tAny, index: 0 }, { k: "abc", sch: () => T.ref(tAny.$anchor), index: 1 }])

  for (let model of Object.keys(store.fields))
    assert.isOk(store.fields[model].$anchor.startsWith("def_"))
})

it("#value invalid json", () => {
  assert.isNotOk(T.value("invalid"))
})

it("#value valid json", () => {
  assert.equal(T.value("\"valid\"").type, "value")
})

it("#value valid json but is denied", () => {
  assert.isNotOk(T.value("[1,2,3]"))
})
