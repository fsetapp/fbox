import { assert } from "@esm-bundle/chai";
import { match } from "../lib/rules.js"
import * as M from "../lib/pkgs/model.js"
import * as Core from "../lib/pkgs/core.js"

const { structSheet } = M

const childrenRules = (structSheet, sch) => {
  for (let row of structSheet.sheet)
    switch (true) {
      case match(sch, row.selector):
        return row.rules.children
    }
}

describe("#match", () => {
  it("matchs an attribute whose value is array", () => {
    const { allowedSchs } = childrenRules(structSheet, M.record())
    assert.notSameDeepMembers(allowedSchs, [Core.blank()])
  })
})
