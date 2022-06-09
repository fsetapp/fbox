import { assert } from "@esm-bundle/chai";
import { get, update, put, pop, move, changeT } from "../lib/sch.js"
import * as M from "../lib/pkgs/model.js"
// Does it necessary needs registry? Seems like a coupling.
import { s } from "../lib/pkgs/registry.js"
// So every store seems to need the registry (skip module import, treat them as global)
const initStore = () => M.record({ structSheet: { [s(M).t]: M.structSheet } })

describe("Sch operations", () => {
  describe("#put", () => {
    var store, allSchs

    beforeEach(() => {
      store = M.record()
      allSchs = [M.record, M.list, M.tuple, M.union, M.string, M.bool, M.int16, () => M.string({ v: "json string" })]
    });

    it("#put a child", () => {
      put(store, "", [{ k: `model_a`, sch: M.string, index: 0 }])
      assert.equal(store.fields.find(a => a.key == "model_a").t, M.STRING)
    })

    it("#put children", () => {
      put(store, "", allSchs.reverse().map((sch, i) => {
        return { k: `model_${allSchs.length - i}`, sch: sch, index: i }
      }))

      assert.equal(store.fields.length, allSchs.length)
    })

    it("#put a child to List is ignored", () => {
      put(store, "", [{ k: `list_a`, sch: M.list, index: 0 }])
      put(store, "[list_a]", [{ k: `aa`, sch: M.bool, index: 0 }])

      assert.equal(store.fields.find(a => a.key == "list_a").sch.t, M.STRING)
    })

    it("#put a child to Tuple", () => {
      put(store, "", [{ k: `tuple_a`, sch: M.tuple, index: 0 }])
      put(store, "[tuple_a]", [{ k: `aa`, sch: M.integer, index: 0 }])

      assert.deepEqual(store.fields.find(a => a.key == "tuple_a").schs.map(a => a.t), [M.INTEGER, M.STRING])
    })

    it("#put a child to Union", () => {
      put(store, "", [{ k: `union_a`, sch: M.union, index: 0 }])
      put(store, "[union_a]", [{ k: `aa`, sch: M.bool, index: 0 }])

      assert.deepEqual(store.fields.find(a => a.key == "union_a").schs.map(a => a.t), [M.BOOL, M.STRING])
    })

    it("#put a dup key", () => {
      put(store, "", [{ k: `key`, sch: M.int16, index: 0 }])
      put(store, "", [{ k: `key`, sch: M.int8, index: 0 }])

      store.fields[0].key == "key -"
      store.fields[1].key == "key"
      assert.equal(store.fields.length, 2)
    })

    it("#put null key", () => {
      put(store, "", [{ k: null, sch: M.int16, index: 0 }])

      assert.equal(store.fields.length, 1)
      assert.match(store.fields[0].key, /^key_/)
    })

    it("#put index number as key", () => {
      put(store, "", [{ k: 0, sch: M.int16, index: 0 }])

      assert.equal(store.fields.length, 1)
      assert.equal(store.fields[0].key, "0")
    })

    // TODO:
    // it("#put child.index does not exceed total length", () => {
    // })

    // it("#put bulk until halt", () => {
    // })
  })

  describe("#pop", () => {
    var store, allSchs

    beforeEach(() => {
      store = initStore()
      allSchs = [M.record, M.list, M.tuple, M.union, M.string, M.bool, M.int16, () => M.string({ v: "json string" })]
      allSchs.reverse().forEach((sch, i) =>
        put(store, "", [{ k: `model_${allSchs.length - i}`, sch: sch, index: 0 }])
      )
    });

    it("#pop a child", () => {
      assert.changesBy(() => pop(store, "", [2]), store.fields, "length", 1)
      assert.notIncludeMembers(Object.entries(store.fields).map(a => a.t), [M.TUPLE])
    })

    it("#pop children", () => {
      assert.changesBy(() => pop(store, "", [0, 1, 3]), store.fields, "length", 3)
      assert.notIncludeMembers(Object.entries(store.fields).map(a => a.t), [M.RECORD, M.LIST, M.UNION])
    })

    it("#pop a child out of List, still have a least 1 child", () => {
      put(store, "", [{ k: `list_a`, sch: M.list, index: 0 }])
      assert.equal(store.fields.find(a => a.key == "list_a").sch.t, M.STRING)

      pop(store, "[list_a]", [0])
      assert.equal(store.fields.find(a => a.key == "list_a").sch.t, M.STRING)
    })

    it("#pop a child out of Tuple, still have a least 1 child", () => {
      put(store, "", [{ k: `tuple_a`, sch: M.tuple, index: 0 }])
      assert.deepEqual(store.fields.find(a => a.key == "tuple_a").schs.map(a => a.t), [M.STRING])

      pop(store, "[tuple_a]", [0])
      assert.deepEqual(store.fields.find(a => a.key == "tuple_a").schs.map(a => a.t), [M.STRING])
    })

    it("#pop a child out of Union, still have a least 1 child", () => {
      put(store, "", [{ k: `union_a`, sch: M.union, index: 0 }])
      assert.deepEqual(store.fields.find(a => a.key == "union_a").schs.map(a => a.t), [M.STRING])

      pop(store, "[union_a]", [0])
      assert.deepEqual(store.fields.find(a => a.key == "union_a").schs.map(a => a.t), [M.STRING])
    })

    it("#pop a child out of non-container type", () => {
      put(store, "", [{ k: `nonBox`, sch: M.string, index: 0 }])
      assert.doesNotChange(() => pop(store, "[nonBox]", [0, 1, 2]), store, "fields")
    })
  })

  describe("#changeT", () => {
    var store

    beforeEach(() => {
      store = M.record()
    })

    it("#changeT to root store is ignored, root is always a record", () => {
      assert.equal(store.t, M.RECORD)
      changeT(store, "", M.list)
      assert.equal(store.t, M.RECORD)
    })

    it.only("#changeT to a bunch of type", () => {
      put(store, "", [{ k: `a`, sch: M.string, index: 0 }])
      assert.equal(store.fields.find(a => a.key == "a").t, M.STRING)

      changeT(store, "[a]", M.list)
      assert.equal(store.fields.find(a => a.key == "a").t, M.LIST)

      changeT(store, "[a]", M.int16)
      assert.equal(store.fields.find(a => a.key == "a").t, M.INT16)

      changeT(store, "[a]", () => M.structSheet.toVal(M.bool(), true))
      assert.equal(store.fields.find(a => a.key == "a").t, M.BOOLEAN)
    })
  })

  describe("#get", () => {
    var store

    beforeEach(() => {
      store = M.record()
    })

    it("#get invalid path", () => {
      assert.equal(get(store, "bla"), undefined)
    })

    it("#get record path", () => {
      put(store, "", [{ k: "record", sch: M.record, index: 0 }])
      put(store, "[record]", [{ k: "b", sch: M.string, index: 0 }])
      assert.equal(get(store, "[record][b]").t, M.STRING)
    })

    it("#get tuple path", () => {
      put(store, "", [{ k: "tuple", sch: M.tuple, index: 0 }])
      put(store, "[tuple]", [{ k: "b", sch: M.bool, index: 0 }])
      assert.equal(get(store, "[tuple][][0]").t, M.BOOLEAN)
      assert.equal(get(store, "[tuple][][1]").t, M.STRING)
      assert.equal(get(store, "[tuple][][2]"), undefined)
      assert.equal(get(store, "[tuple][]"), undefined)
    })

    it("#get list path", () => {
      put(store, "", [{ k: "list", sch: M.list, index: 0 }])

      assert.equal(get(store, "[list][][0]").t, M.STRING)
      assert.equal(get(store, "[list][][1]"), undefined)
    })
  })

  describe("#move", () => {
    var store

    beforeEach(() => {
      store = M.record()
      put(store, "", [
        { k: "a_list", sch: M.list, index: 0 },
        { k: "b_tuple", sch: M.tuple, index: 1 },
        { k: "c_string", sch: M.string, index: 2 },
        { k: "d_union", sch: M.union, index: 3 }
      ])
      put(store, "[b_tuple]", [
        { k: null, sch: M.int8, index: 1 },
        { k: null, sch: M.int16, index: 2 }
      ])
      put(store, "[d_union]", [
        { k: null, sch: M.int16, index: 1 },
        { k: null, sch: M.record, index: 2 }
      ])
    })

    it("#move same list, one item", () => {
      move(store, { dstPath: "", startIndex: 2 }, { "": [{ id: "0", index: 0 }] })
      assert.deepEqual(store.fields.map(a => a.key), ["b_tuple", "c_string", "a_list", "d_union"])
    })

    it("#move same list, multiple items", () => {
      move(store, { dstPath: "", startIndex: 0 }, { "": [{ id: "2", index: 2 }, { id: "0", index: 0 }] })
      assert.deepEqual(store.fields.map(a => a.key), ["a_list", "c_string", "b_tuple", "d_union"])
    })

    it("#move 1 indexed-src to 1 indexed-dst, one items", () => {
      move(store, { dstPath: "[b_tuple]", startIndex: 0 }, { "[d_union]": [{ id: "2", index: 2 }] })
      assert.deepEqual(store.fields.find(a => a.key == "b_tuple").schs.map(a => a.t), [M.RECORD, M.STRING, M.NULL, M.INT16])
      assert.deepEqual(store.fields.find(a => a.key == "d_union").schs.map(a => a.t), [M.STRING, M.INT16])
    })

    it("#move 2 indexed-src to 1 keyed-dst", () => {
      move(store, { dstPath: "", startIndex: 1 }, { "[d_union]": [{ id: "2", index: 2 }], "[b_tuple]": [{ id: "2", index: 2 }] })
      assert.deepEqual(store.fields.map(a => a.key), ["a_list", "2", "2 -", "b_tuple", "c_string", "d_union"])
      assert.deepEqual(store.fields.find(a => a.key == "d_union").schs.map(a => a.t), [M.STRING, M.INT16])
      assert.deepEqual(store.fields.find(a => a.key == "b_tuple").schs.map(a => a.t), [M.STRING, M.INT8])
    })

    it("#move outer into subtree itself", () => {
      move(store, { dstPath: "[d_union][][2]", startIndex: 1 }, { "": [{ id: "[d_union]", index: 3 }] })
      assert.isOk(store.fields.find(a => a.key == "d_union"))
    })

    it("#move mutiple src(s), some of which are subtree", () => {
      let d_union_2_0 = get(store, "[d_union][][2]")
      move(store, { dstPath: "", startIndex: 1 }, { "[d_union]": [{ id: "2", index: 2 }], "[d_union][][2]": [{ id: "0", index: 0 }] })
      assert.deepEqual(store.fields.find(a => a.key == store.fields[1].key), d_union_2_0)
    })

    it("#move into one of selected items", () => {
      move(store, { dstPath: "[d_union]", startIndex: 1 }, { "": [{ id: "[d_union]", index: 3 }, { id: "[c_string]", index: 2 }] })
      assert.isOk(store.fields.find(a => a.key == "d_union"))
    })
  })

  describe("#update", () => {
    var store

    beforeEach(() => {
      store = M.record()
      put(store, "", [{ k: "abc", sch: M.bool, index: 0 }])
    })

    it("#update sch with arbitrary data", () => {
      update(store, "[abc]", (a, m) => ({ ...a, whatever: "whatever" }))
      assert.equal(get(store, "[abc]").whatever, "whatever")
    })

    // it("#bulkUpdate until halt", () => {

    // })
  })
})
