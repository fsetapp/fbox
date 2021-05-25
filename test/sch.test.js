import { assert } from "@esm-bundle/chai";
import { get, update, put, pop, move, changeType } from "../lib/sch.js"
import * as T from "../lib/sch/type.js"

describe("Sch operations", () => {
  describe("#put", () => {
    var store, allSchs

    beforeEach(() => {
      store = T.record()
      allSchs = [T.record, T.list, T.tuple, T.union, T.any, T.string, T.bool, T.int16, T.nil, () => T.value("\"json string\"")]
    });

    it("#put a child", () => {
      put(store, "", [{ k: `model_a`, sch: T.string, index: 0 }])
      assert.equal(store.fields.find(a => a.key == "model_a").type, T.STRING)
    })

    it("#put children", () => {
      put(store, "", allSchs.reverse().map((sch, i) => {
        return { k: `model_${allSchs.length - i}`, sch: sch, index: i }
      }))

      assert.equal(store.fields.length, allSchs.length)
    })

    it("#put a child to List is ignored", () => {
      put(store, "", [{ k: `list_a`, sch: T.list, index: 0 }])
      put(store, "[list_a]", [{ k: `aa`, sch: T.string, index: 0 }])

      assert.equal(store.fields.find(a => a.key == "list_a").sch.type, T.ANY)
    })

    it("#put a child to Tuple", () => {
      put(store, "", [{ k: `tuple_a`, sch: T.tuple, index: 0 }])
      put(store, "[tuple_a]", [{ k: `aa`, sch: T.string, index: 0 }])

      assert.deepEqual(store.fields.find(a => a.key == "tuple_a").schs.map(a => a.type), [T.STRING, T.ANY])
    })

    it("#put a child to Union", () => {
      put(store, "", [{ k: `union_a`, sch: T.union, index: 0 }])
      put(store, "[union_a]", [{ k: `aa`, sch: T.string, index: 0 }])

      assert.deepEqual(store.fields.find(a => a.key == "union_a").schs.map(a => a.type), [T.STRING, T.ANY])
    })

    it("#put a dup key", () => {
      put(store, "", [{ k: `key`, sch: T.int16, index: 0 }])
      put(store, "", [{ k: `key`, sch: T.nil, index: 0 }])

      store.fields[0].key == "key –"
      store.fields[1].key == "key"
      assert.equal(store.fields.length, 2)
    })

    it("#put null key", () => {
      put(store, "", [{ k: null, sch: T.int16, index: 0 }])

      assert.equal(store.fields.length, 1)
      assert.match(store.fields[0].key, /^key_/)
    })

    it("#put index number as key", () => {
      put(store, "", [{ k: 0, sch: T.int16, index: 0 }])

      assert.equal(store.fields.length, 1)
      assert.equal(store.fields[0].key, "0")
    })
  })

  describe("#pop", () => {
    var store, allSchs

    beforeEach(() => {
      store = T.record()
      allSchs = [T.record, T.list, T.tuple, T.union, T.any, T.string, T.bool, T.int16, T.nil, () => T.value("\"json string\"")]
      allSchs.reverse().forEach((sch, i) =>
        put(store, "", [{ k: `model_${allSchs.length - i}`, sch: sch, index: 0 }])
      )
    });

    it("#pop a child", () => {
      assert.changesBy(() => pop(store, "", [2]), store.fields, "length", 1)
      assert.notIncludeMembers(Object.entries(store.fields).map(a => a.type), ["tuple"])
    })

    it("#pop children", () => {
      assert.changesBy(() => pop(store, "", [0, 1, 3]), store.fields, "length", 3)
      assert.notIncludeMembers(Object.entries(store.fields).map(a => a.type), ["record", "list", "union"])
    })

    it("#pop a child out of List, still have a least 1 child", () => {
      put(store, "", [{ k: `list_a`, sch: T.list, index: 0 }])
      assert.equal(store.fields.find(a => a.key == "list_a").sch.type, T.ANY)

      pop(store, "[list_a]", [0])
      assert.equal(store.fields.find(a => a.key == "list_a").sch.type, T.ANY)
    })

    it("#pop a child out of Tuple, still have a least 1 child", () => {
      put(store, "", [{ k: `tuple_a`, sch: T.tuple, index: 0 }])
      assert.deepEqual(store.fields.find(a => a.key == "tuple_a").schs.map(a => a.type), [T.ANY])

      pop(store, "[tuple_a]", [0])
      assert.deepEqual(store.fields.find(a => a.key == "tuple_a").schs.map(a => a.type), [T.ANY])
    })

    it("#pop a child out of Union, still have a least 1 child", () => {
      put(store, "", [{ k: `union_a`, sch: T.union, index: 0 }])
      assert.deepEqual(store.fields.find(a => a.key == "union_a").schs.map(a => a.type), [T.ANY])

      pop(store, "[union_a]", [0])
      assert.deepEqual(store.fields.find(a => a.key == "union_a").schs.map(a => a.type), [T.ANY])
    })

    it("#pop a child out of non-container type", () => {
      put(store, "", [{ k: `nonBox`, sch: T.string, index: 0 }])
      assert.doesNotChange(() => pop(store, "[nonBox]", [0, 1, 2]), store, "fields")
    })
  })

  describe("#changeType", () => {
    var store

    beforeEach(() => {
      store = T.record()
    })

    it("#changeType to root store is ignored, root is always a record", () => {
      assert.equal(store.type, T.RECORD)
      changeType(store, "", T.list)
      assert.equal(store.type, T.RECORD)
    })

    it("#changeType to a bunch of type", () => {
      put(store, "", [{ k: `a`, sch: T.string, index: 0 }])
      assert.equal(store.fields.find(a => a.key == "a").type, T.STRING)

      changeType(store, "[a]", T.list)
      assert.equal(store.fields.find(a => a.key == "a").type, T.LIST)

      changeType(store, "[a]", T.int16)
      assert.equal(store.fields.find(a => a.key == "a").type, T.INT16)

      changeType(store, "[a]", () => T.value("\"json\""))
      assert.equal(store.fields.find(a => a.key == "a").type, T.VALUE)
    })
  })

  describe("#get", () => {
    var store

    beforeEach(() => {
      store = T.record()
    })

    it("#get invalid path", () => {
      assert.equal(get(store, "bla"), undefined)
    })

    it("#get record path", () => {
      put(store, "", [{ k: "record", sch: T.record, index: 0 }])
      put(store, "[record]", [{ k: "b", sch: T.string, index: 0 }])
      assert.equal(get(store, "[record][b]").type, T.STRING)
    })

    it("#get tuple path", () => {
      put(store, "", [{ k: "tuple", sch: T.tuple, index: 0 }])
      put(store, "[tuple]", [{ k: "b", sch: T.string, index: 0 }])
      assert.equal(get(store, "[tuple][][0]").type, T.STRING)
      assert.equal(get(store, "[tuple][][1]").type, T.ANY)
      assert.equal(get(store, "[tuple][][2]"), undefined)
      assert.equal(get(store, "[tuple][]"), undefined)
    })

    it("#get list path", () => {
      put(store, "", [{ k: "list", sch: T.list, index: 0 }])

      assert.equal(get(store, "[list][][0]").type, T.ANY)
      assert.equal(get(store, "[list][][1]"), undefined)
    })
  })

  describe("#move", () => {
    var store

    beforeEach(() => {
      store = T.record()
      put(store, "", [
        { k: "a_list", sch: T.list, index: 0 },
        { k: "b_tuple", sch: T.tuple, index: 1 },
        { k: "c_string", sch: T.string, index: 2 },
        { k: "d_union", sch: T.union, index: 3 }
      ])
      put(store, "[b_tuple]", [
        { k: null, sch: T.nil, index: 1 },
        { k: null, sch: T.int16, index: 2 }
      ])
      put(store, "[d_union]", [
        { k: null, sch: T.int16, index: 1 },
        { k: null, sch: T.record, index: 2 }
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
      assert.deepEqual(store.fields.find(a => a.key == "b_tuple").schs.map(a => a.type), [T.RECORD, T.ANY, T.NULL, T.INT16])
      assert.deepEqual(store.fields.find(a => a.key == "d_union").schs.map(a => a.type), [T.ANY, T.INT16])
    })

    it("#move 2 indexed-src to 1 keyed-dst", () => {
      move(store, { dstPath: "", startIndex: 1 }, { "[d_union]": [{ id: "2", index: 2 }], "[b_tuple]": [{ id: "2", index: 2 }] })
      assert.deepEqual(store.fields.map(a => a.key), ["a_list", "2", "2 –", "b_tuple", "c_string", "d_union"])
      assert.deepEqual(store.fields.find(a => a.key == "d_union").schs.map(a => a.type), [T.ANY, T.INT16])
      assert.deepEqual(store.fields.find(a => a.key == "b_tuple").schs.map(a => a.type), [T.ANY, T.NULL])
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
      store = T.record()
      put(store, "", [{ k: "abc", sch: T.any, index: 0 }])
    })

    it("#update sch with arbitrary data", () => {
      update(store, "[abc]", (a, m) => ({ ...a, whatever: "whatever" }))
      assert.equal(get(store, "[abc]").whatever, "whatever")
    })
  })
})
