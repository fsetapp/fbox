import { assert } from "@esm-bundle/chai";
import { match } from "../lib/rules.js"
import * as M from "../lib/pkgs/model.js"
import * as Core from "../lib/pkgs/core.js"

const { structSheet } = M

const childrenRules = (structSheet, sch) =>
  structSheet.sheet(sch.t).children

describe("#", () => {
  it("tests nothing yet", () => {

  })
})
