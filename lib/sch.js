import * as T from "./sch/type.js"
export { get, update, put, putSelected, pop, move, changeType }

const clone = (obj) => {
  let sch = JSON.parse(JSON.stringify(obj))
  walk(sch, (a, m) => T.putAnchor(() => a, null, { force: true }))
  return sch
}

/* Any computed data should be in meta variable.
   Anything needed to be saved across program restart should be in the sch.
 */
const walk = (sch, f, meta = { path: "", level: 1, parent: {} }) => {
  sch._halt = false
  sch = f(sch, meta)
  if (sch._halt) return sch

  switch (true) {
    case [T.RECORD].includes(sch.type):
      let keys = Object.keys(sch.fields)

      for (let i = keys.length - 1; i >= 0; i--) {
        let k = keys[i]
        let sch_ = sch.fields[k]
        let nextMeta = { path: `${meta.path}[${k}]`, level: meta.level + 1, parent: { _box: sch._box, type: sch.type } }
        sch_ = walk(sch_, f, nextMeta)

        sch.fields[k] = sch_
        if (sch_._halt) return Object.assign(sch, { _halt: true })
      }

      break
    case [T.TUPLE, T.UNION].includes(sch.type):
      for (let i = 0; i < sch.schs.length; i++) {
        let sch_ = sch.schs[i]
        let nextMeta = { path: `${meta.path}[][${i}]`, level: meta.level + 1, parent: { _box: sch._box, type: sch.type } }
        sch_ = walk(sch_, f, nextMeta)

        sch.schs[i] = sch_
        if (sch_._halt) return Object.assign(sch, { _halt: true })
      }

      break
    case [T.LIST].includes(sch.type):
      let nextMeta = { path: `${meta.path}[][0]`, level: meta.level + 1, parent: { _box: sch._box, type: sch.type } }
      let sch_ = walk(sch.sch, f, nextMeta)

      sch.sch = sch_
      if (sch_._halt) return Object.assign(sch, { _halt: true })
      break
    default:
      sch
  }

  return sch
}

const pop = (schema, path, indices) => {
  let result = { original: {}, popped: [] }
  let descIndices = indices.sort((a, b) => b - a)

  walk(schema, (sch_, meta) => {
    if (meta.path != path) return sch_
    else {
      switch (sch_.type) {
        case T.RECORD:
          let ikeys = descIndices.map(i => [i, sch_.order[i]]).filter(([i, k]) => k)

          for (let [i, k] of ikeys) {
            result.popped.unshift({ k: k, sch: sch_.fields[k], index: i })
            delete sch_.fields[k]
          }
          for (let i of descIndices) sch_.order.splice(i, 1)

          break
        case T.LIST:
          break
        case T.TUPLE:
          for (let i of descIndices)
            result.popped.unshift({ k: i, sch: sch_.schs.splice(i, 1)[0], index: i })

          if (sch_.schs.length == 0) sch_.schs.splice(0, 0, T.putAnchor(T.any))
          break
        case T.UNION:
          for (let i of descIndices)
            result.popped.unshift({ k: i, sch: sch_.schs.splice(i, 1)[0], index: i })

          if (sch_.schs.length == 0) sch_.schs.splice(0, 0, T.putAnchor(T.any))
          break
        default:
          sch_
      }
      return sch_
    }
  })

  return result
}

const filterMostOuters = (paths) => {
  return paths.filter(p => {
    for (let p_ of paths) {
      if (p == p_) return true
      else if (p.startsWith(p_)) return false
    }
  })
}

const put = (schema, path, rawSchs) => {
  let result = { original: {}, inserted: [] }
  let ascRawSchs = rawSchs.sort((a, b) => a.index - b.index)

  const boundIndex = (index, arr) => {
    index = Math.max(index, 0)
    index = Math.min(index, arr.length)
    return index
  }

  walk(schema, (sch_, meta) => {
    if (meta.path != path) return sch_
    else {
      switch (sch_.type) {
        case T.RECORD:
          for (let { k, sch, index } of ascRawSchs) {
            k = k == 0 ? "0" : k
            k = k || `key_${Math.floor(Date.now() / 100)}`
            k = `${k}`
            while (sch_.fields[k]) k = `${k} –`
            index = boundIndex(index, sch_.order)

            sch_.fields[k] = T.putAnchor(sch, sch_._box)
            sch_.order.splice(index, 0, k)
            result.inserted.push({ k: k, sch: sch_.fields[k], index: index })
          }

          break
        case T.LIST:
          break
        case T.TUPLE:
          for (let { k, sch, index } of ascRawSchs) {
            index = boundIndex(index, sch_.schs)
            sch_.schs.splice(index, 0, T.putAnchor(sch, sch_._box))
            result.inserted.push({ k: k, sch: sch_.schs[index], index: index })
          }
          break
        case T.UNION:
          for (let { k, sch, index } of ascRawSchs) {
            index = boundIndex(index, sch_.schs)
            sch_.schs.splice(index, 0, T.putAnchor(sch, sch_._box))
            result.inserted.push({ k: k, sch: sch_.schs[index], index: index })
          }
        default:
          sch_
      }
      return sch_
    }
  })
  return result
}

const move = (store, { dstPath, startIndex = 0 }, selectedPerParent) => {
  startIndex = Math.max(startIndex, 0)

  const pinDst = (store, dstPath, pin) =>
    update(store, dstPath, (a, m) => { a._pinId = pin; return a })

  const getPinedDst = (store, pin) =>
    getByAndUpdate(store, (a, m) => a._pinId == pin, (a, m) => { a._pinned = m; return a })

  const srcPaths = filterMostOuters(Object.keys(selectedPerParent))
  let moved = {}
  let poppedPerSrc = {}
  let pin = Symbol(dstPath)

  for (let srcPath of srcPaths) {
    let selectedItems = selectedPerParent[srcPath]
    let isDstSubtree = selectedItems.filter(c => dstPath.startsWith(c.id)).length != 0
    const newK = (index) => selectedItems.filter(c => c.index == index)[0]?.newK

    if (!isDstSubtree) {
      pinDst(store, dstPath, pin)

      let result = pop(store, srcPath, selectedItems.map(c => c.index))
      let rawSchs = result.popped.map(({ k, sch, index }) => {
        return { k: newK(index) || k, sch: () => sch }
      })

      poppedPerSrc[srcPath] = rawSchs
    }
  }

  let rawSchs = Object.values(poppedPerSrc)
    .flatMap((popped) => popped)
    .map((a, i) => { return { ...a, index: startIndex + i } })

  let dst = getPinedDst(store, pin)
  if (dst) {
    let result_ = put(store, dst._pinned.path, rawSchs)
    moved[dst._pinned.path] = result_.inserted
  }

  return moved
}

const putSelected = (store, { dstPath, startIndex = 0 }, selectedPerParent) => {
  let rawSchs = Object.values(selectedPerParent).reduce((acc, cc,) => {
    let ids = cc.map(c => c.id)
    let collector = []

    getByAndUpdate(store, (a, m) => {
      if (ids.includes(m.path)) { a._meta = m; collector.unshift(a) }
      if (collector.length == ids.length) return true
      return false
    }, (a, m) => a)

    for (let c of cc) {
      if (dstPath.startsWith(c.id)) continue
      let sch = collector.find(a => a._meta.path == c.id)
      if (sch) acc.unshift({ k: c.key, sch: () => clone(sch), index: startIndex + acc.length, id: c.id })
    }
    return acc
  }, [])

  let pasted = {}
  let result_ = put(store, dstPath, rawSchs)

  if (result_.inserted.length != 0) pasted[dstPath] = result_.inserted
  return pasted
}

const changeType = (store, path, sch) =>
  update(store, path, (a, m) => {
    let newSch = T.putAnchor(sch, m.parent._box)
    if (a.type == newSch.type) return a
    else {
      let { title, description, rw, required } = a
      Object.assign(newSch, { title, description, rw, required })
      return newSch
    }
  })

const get = (currentNode, path) =>
  getByAndUpdate(currentNode, (a, m) => m.path == path, (a, m) => { a._meta = m; return a })

const update = (currentNode, path, fupdate) =>
  getByAndUpdate(currentNode, (a, m) => m.path == path, fupdate)

const getByAndUpdate = (currentNode, fget, fupdate) => {
  let foundSch
  walk(currentNode, (sch_, meta) => {
    if (fget(sch_, meta)) {
      foundSch = fupdate(sch_, meta)
      foundSch._halt = true
      return foundSch
    }
    else return sch_
  })
  if (foundSch) foundSch._halt = false
  return foundSch
}
