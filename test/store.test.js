import { assert } from "@esm-bundle/chai";
import { initStore } from "./test_helper.js";
import { putAnchor } from "../lib/pkgs/core.js";
import { buildFolderTree } from "../lib/repo/store.js"
import * as P from "../lib/pkgs/proj.js"

describe("store", () => {
  var store
  beforeEach(() => {
    store = initStore(P.project)
  })
  it("#buildFolderTree from empty folder", () => {
    const folder_a = { ...putAnchor(P.folder), key: "a" }
    const folder_a1 = { ...putAnchor(P.folder), key: "a1" }
    const folder_a_keep = folder_a.fields.splice(0, 1)[0]
    const folder_a1_keep = folder_a1.fields.splice(0, 1)[0]

    store.fields = [
      {
        ...folder_a_keep,
        lpath: [folder_a]
      },
      {
        ...folder_a1_keep,
        lpath: [folder_a, folder_a1]
      },
    ]
    buildFolderTree(store)
    const folderA = store.fields[0]
    const folderA1 = folderA.fields[1]

    assert.equal(store.fields.length, 1)
    assert.equal(folderA.$a, folder_a.$a)
    assert.equal(folderA.fields.length, 2)
    assert.equal(folderA.fields[0].$a, folder_a_keep.$a)
    assert.equal(folderA1.$a, folder_a1.$a)
    assert.equal(folderA1.fields.length, 1)
    assert.equal(folderA1.fields[0].$a, folder_a1_keep.$a)
  })
})
