import * as Controller from "./repo/controller.js"
import { taggedDiff } from "./repo/tagged_diff.js"
import * as Store from "./repo/store.js"
import * as Walk from "./repo/walk.js"
import * as Core from "./pkgs/core.js"
import * as Diff from "../lib/sch/diff.js"

export const Project = {
  Store,
  Controller,
  Core,
  Diff,
  Walk,
  Remote: { taggedDiff }
}
