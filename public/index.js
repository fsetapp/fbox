import { init, update, store, allSchs } from "../lib/main.js"
import * as Sch from "../lib/sch.js"
import { randInt } from "../lib/utils.js"

"use strict"

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
