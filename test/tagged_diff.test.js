import { assert } from "@esm-bundle/chai";
import { toStore } from "./test_helper.js"
import { buildBaseIndices, diff } from "../lib/sch/diff.js"
import { taggedDiff } from "../lib/project/tagged_diff.js"

import * as Sch from "../lib/sch.js"
import * as T from "../lib/sch/type.js"
import { writable } from "../lib/utils.js";

describe("#taggedDiff", () => {
  const asBase = (store) => buildBaseIndices(JSON.parse(JSON.stringify(store)))
  const runDiff = (current, base) => writable(current, "_diffToRemote", diff(current, base))

  it("moves subfmodel to be fmodel", () => {
    let project = T.putAnchor(T.record)
    Sch.put(project, "", [
      { k: "file_1", sch: T.record, index: 0 },
    ])
    Sch.put(project, "[file_1]", [
      { k: "fmodel_A", sch: T.record, index: 0 },
      { k: "fmodel_B", sch: T.record, index: 1 },
    ])
    Sch.put(project, "[file_1][fmodel_A]", [
      { k: "A1", sch: T.record, index: 0 },
      { k: "A2", sch: T.record, index: 1 }
    ])

    let current = toStore(project)
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
      for (let parent of Object.keys(reorder.fmodels)) {
        assert.equal(reorder.fmodels[parent].pa, file1.$a)
        assert.isOk(reorder.fmodels[parent].$a)
        assert.isOk(reorder.fmodels[parent].t)
        assert.isOk(reorder.fmodels[parent].key)
        assert.isNumber(reorder.fmodels[parent].index)
        assert.isNotOk(reorder.fmodels[parent].sch)
      }
    })
  })

  it("moves fmodel to be subfmodel", () => {
    let project = T.putAnchor(T.record)
    Sch.put(project, "", [
      { k: "file_1", sch: T.record, index: 0 },
    ])
    Sch.put(project, "[file_1]", [
      { k: "A1", sch: T.string, index: 0 },
      { k: "fmodel_A", sch: T.record, index: 1 },
      { k: "fmodel_B", sch: T.record, index: 2 },
    ])

    let current = toStore(project)
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
      for (let parent of Object.keys(reorder.fmodels)) {
        assert.equal(reorder.fmodels[parent].pa, Sch.get(current, "[file_1]").$a)
        assert.isOk(reorder.fmodels[parent].$a)
        assert.isOk(reorder.fmodels[parent].t)
        assert.isOk(reorder.fmodels[parent].key)
        assert.isNumber(reorder.fmodels[parent].index)
        assert.isNotOk(reorder.fmodels[parent].sch)
      }
    })
  })

  it("moves fmodel to be fmodel", () => {
    let project = T.putAnchor(T.record)
    Sch.put(project, "", [
      { k: "file_1", sch: T.record, index: 0 },
      { k: "file_2", sch: T.record, index: 1 },
    ])
    Sch.put(project, "[file_1]", [
      { k: "fmodel_A", sch: T.record, index: 0 },
      { k: "fmodel_B", sch: T.record, index: 1 },
    ])

    let current = toStore(project)
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
      for (let parent of Object.keys(reorder.fmodels)) {
        assert.equal(reorder.fmodels[parent].pa, Sch.get(current, "[file_1]").$a)
        assert.isOk(reorder.fmodels[parent].$a)
        assert.isOk(reorder.fmodels[parent].t)
        assert.isOk(reorder.fmodels[parent].key)
        assert.isNumber(reorder.fmodels[parent].index)
        assert.isNotOk(reorder.fmodels[parent].sch)
      }
    })
  })

  it("removes fmodel one by one", () => {
  })
})
describe("#taggedDiff from actions#addSch ", () => {
  // Database blows this up already
  it("dedup what is in both added{} and changed{}", () => { })
  // key "$a" not found in: %{"pa" => "fa3b0db8-ee72-4778-acf5-ec9600f2fe47"}
  // SEEM TO BE SERVER-SIDE PROBLEM
  it("ensure added item has mandatory properties $a", () => { })
})
