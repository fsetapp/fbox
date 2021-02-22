import { init, update } from "./main.js"
import * as Sch from "./sch.js"
import * as T from "./sch/type.js"
import { randInt } from "./utils.js"

"use strict"

const allSchs = [T.record, T.list, T.tuple, T.union, T.any, T.string, T.bool, T.number, T.nil, () => T.value("\"json string\"")]
var store = { ...T.putAnchor(T.record), _box: T.FMODEL_BOX, _allSchs: allSchs }

let fixture = []
for (var i = 0; i < 1000; i++)
  fixture.push(allSchs[randInt(allSchs.length)])

fixture.forEach((sch, i) =>
  Sch.put(store, "", [{ k: `model_${fixture.length - i}`, sch: sch, index: 0 }])
)

document.addEventListener("sch-update", (e) => {
  let { detail, target } = e
  update({ store: store, detail, target })
})

addEventListener("DOMContentLoaded", e => {
  init({ store, treeSelector: "[id='fmodel'] [role='tree']", metaSelector: "sch-meta" })
})
