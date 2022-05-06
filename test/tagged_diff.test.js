import { assert } from "@esm-bundle/chai";
import { initStore, initFileStore } from "./test_helper.js"
import * as Store from "../lib/repo/store.js"
import { taggedDiff } from "../lib/repo/tagged_diff.js"
import { diff } from "../lib/sch/diff.js"

import { putAnchor, TOPLV_TAG } from "../lib/pkgs/core.js"
import * as M from "../lib/pkgs/model.js"
import * as P from "../lib/pkgs/proj.js"

import * as Sch from "../lib/sch.js"
import { writable } from "../lib/utils.js";

const asBase = (store) => Store.Indice.buildBaseIndices(JSON.parse(JSON.stringify(store)))
const runDiff = (current, base) => writable(current, "_diffToRemote", diff(current, base))
const assertDiff = (diff) => {
  const { changed, added, removed, reorder } = diff
  const assertProp = (things, { has = [], hasNot = [] }) => {
    for (let key of Object.keys(things)) {
      for (let prop1 of has) assert.isDefined(things[key][prop1], prop1)
      for (let prop0 of hasNot) assert.isUndefined(things[key][prop0], prop0)
    }
  }

  assertProp(changed.files, { has: ["lpath"] })
  assertProp(changed.fmodels, { has: ["fields"], hasNot: ["lpath"] })

  assertProp(added.files, { has: ["lpath"], hasNot: ["fields"] })
  assertProp(added.fmodels, { hasNot: ["lpath"] })

  assertProp(removed.files, { hasNot: ["fields", "lpath"] })
  assertProp(removed.fmodels, { hasNot: ["fields", "lpath"] })

  assertProp(reorder.files, { has: ["lpath"], hasNot: ["fields"] })
  assertProp(reorder.fmodels, { has: ["$a", "t", "key", "index"], hasNot: ["fields", "lpath", "sch"] })
}

describe("#taggedDiff", () => {
  var project

  beforeEach(() => {
    project = putAnchor(P.project)
    project = initStore(project)
  })
  it("moves subfmodel to be fmodel", () => {
    Sch.put(project, "", [
      { k: "file_1", sch: P.modelFile, index: 0 },
    ])
    Sch.put(project, "[file_1]", [
      { k: "fmodel_A", sch: () => M.record({ tag: TOPLV_TAG }), index: 0 },
      { k: "fmodel_B", sch: () => M.record({ tag: TOPLV_TAG }), index: 1 },
    ])
    Sch.put(project, "[file_1][fmodel_A]", [
      { k: "A1", sch: M.record, index: 0 },
      { k: "A2", sch: M.record, index: 1 }
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    Sch.move(current, { dstPath: "[file_1]" }, { "[file_1][fmodel_A]": [{ id: "[file_1][fmodel_A][A1]", index: 0 }] })
    let file1 = Sch.get(current, "[file_1]")

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.deepEqual(added.files, {})
      assert.deepEqual(added.fmodels["[file_1][A1]"], Sch.get(current, "[file_1][A1]"))
      assert.equal(Object.keys(added.fmodels).length, 1)

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels, {})

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels["[file_1][fmodel_A]"], { ...Sch.get(current, "[file_1][fmodel_A]"), pa: file1.$a })
      assert.equal(Object.keys(changed.fmodels).length, 1)

      assert.deepEqual(reorder.files, {})
      assert.equal(reorder.fmodels["[file_1][A1]"].index, 0)
      assert.equal(reorder.fmodels["[file_1][fmodel_A]"].index, 1)
      assert.equal(reorder.fmodels["[file_1][fmodel_B]"].index, 2)

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("moves fmodel to be subfmodel", () => {
    Sch.put(project, "", [
      { k: "file_1", sch: P.modelFile, index: 0 },
    ])
    Sch.put(project, "[file_1]", [
      { k: "A1", sch: M.string, index: 0 },
      { k: "fmodel_A", sch: () => M.record({ tag: TOPLV_TAG }), index: 1 },
      { k: "fmodel_B", sch: () => M.record({ tag: TOPLV_TAG }), index: 2 },
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    let moved = Sch.move(current, { dstPath: "[file_1][fmodel_A]" }, { "[file_1]": [{ id: "[file_1][A1]", index: 0 }] })
    moved = moved["[file_1][fmodel_A]"][0].sch

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.deepEqual(added.files, {})
      assert.deepEqual(added.fmodels, {})

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels["[file_1][A1]"], { $a: moved.$a, pa: Sch.get(current, "[file_1]").$a })
      assert.equal(Object.keys(removed.fmodels).length, 1)

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels["[file_1][fmodel_A]"], Sch.get(current, "[file_1][fmodel_A]"))
      assert.equal(Object.keys(changed.fmodels).length, 1)

      assert.deepEqual(reorder.files, {})
      assert.equal(reorder.fmodels["[file_1][fmodel_A]"].index, 0)
      assert.equal(reorder.fmodels["[file_1][fmodel_B]"].index, 1)

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("moves fmodel to be fmodel", () => {
    Sch.put(project, "", [
      { k: "file_1", sch: P.modelFile, index: 0 },
      { k: "file_2", sch: P.modelFile, index: 1 },
    ])
    Sch.put(project, "[file_1]", [
      { k: "fmodel_A", sch: () => M.record({ tag: TOPLV_TAG }), index: 0 },
      { k: "fmodel_B", sch: () => M.record({ tag: TOPLV_TAG }), index: 1 },
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    let moved = Sch.move(current, { dstPath: "[file_2]" }, { "[file_1]": [{ id: "[file_1][fmodel_A]", index: 0 }] })
    moved = moved["[file_2]"][0].sch

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.deepEqual(added.files, {})
      assert.deepEqual(added.fmodels["[file_2][fmodel_A]"], Sch.get(current, "[file_2][fmodel_A]"))
      assert.equal(Object.keys(added.fmodels).length, 1)

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels["[file_2][fmodel_A]"], Sch.get(current, "[file_1][fmodel_A]"))
      assert.equal(Object.keys(removed.fmodels).length, 1)

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels, {})

      assert.deepEqual(reorder.files, {})
      assert.equal(reorder.fmodels["[file_1][fmodel_B]"].index, 0)
      assert.equal(Object.keys(reorder.fmodels).length, 1)

      assertDiff({ changed, added, removed, reorder })
    })
  })

  it("removes fmodel one by one", () => {
    Sch.put(project, "", [
      { k: "file_1", sch: P.modelFile, index: 0 },
      { k: "file_2", sch: P.modelFile, index: 1 },
    ])
    Sch.put(project, "[file_1]", [
      { k: "fmodel_A", sch: () => M.record({ tag: TOPLV_TAG }), index: 0 },
      { k: "fmodel_B", sch: () => M.record({ tag: TOPLV_TAG }), index: 1 },
    ])
    Sch.put(project, "[file_1][fmodel_A]", [
      { k: "A1", sch: M.string, index: 0 },
    ])

    let current = initFileStore(project)
    let base = asBase(current)

    let poppedPerSrc = Sch.popToRawSchs(current, { "[file_1][fmodel_A]": [{ id: "[file_1][fmodel_A][A1]", index: 0 }] })
    assert.deepEqual(poppedPerSrc["[file_1][fmodel_A]"][0].sch(), Sch.get(base, "[file_1][fmodel_A][A1]"))
    let file1 = Sch.get(current, "[file_1]")

    runDiff(current, base)
    taggedDiff(current, (diff) => {
      const { changed, added, removed, reorder } = diff
      assert.deepEqual(added.files, {})
      assert.deepEqual(added.fmodels, {})

      assert.deepEqual(removed.files, {})
      assert.deepEqual(removed.fmodels, {})

      assert.deepEqual(changed.files, {})
      assert.deepEqual(changed.fmodels["[file_1][fmodel_A]"], { ...Sch.get(current, "[file_1][fmodel_A]"), pa: file1.$a })

      assert.deepEqual(reorder.files, {})
      assert.deepEqual(reorder.fmodels, {})

      assertDiff({ changed, added, removed, reorder })
    })
  })

  // it.only("NEW nested folder", () => {
  //   Sch.put(project, "", [
  //     { k: "folder_1", sch: P.folder, index: 0 },
  //   ])

  //   let current = initFileStore(project)
  //   let base = asBase(current)

  //   Sch.put(current, "[folder_1]", [
  //     { k: "[folder_11]", sch: P.folder, index: 0 },
  //   ])

  //   runDiff(current, base)
  //   taggedDiff(current, (diff) => {
  //     const { changed, added, removed, reorder } = diff
  //     assert.deepEqual(added.files, {})
  //     assert.deepEqual(added.fmodels, {})

  //     assert.deepEqual(removed.files, {})
  //     assert.deepEqual(removed.fmodels, {})

  //     assert.deepEqual(changed.files, {})
  //     assert.deepEqual(changed.fmodels, {})

  //     assert.deepEqual(reorder.files, {})
  //     assert.deepEqual(reorder.fmodels, {})

  //     assertDiff({ changed, added, removed, reorder })
  //   })
  // })
})
describe("#taggedDiff from actions#addSch ", () => {
  // Database blows this up already
  it("dedup what is in both added{} and changed{}", () => { })
  // key "$a" not found in: %{"pa" => "fa3b0db8-ee72-4778-acf5-ec9600f2fe47"}
  // SEEM TO BE SERVER-SIDE PROBLEM
  it("ensure added item has mandatory properties $a", () => { })
})
