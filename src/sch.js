import * as T from "./sch/type.js"
export { get, update, put, putSelected, pop, move, changeType }

const clone = (obj) => JSON.parse(JSON.stringify(obj))

/* Any computed data should be in meta variable.
   Anything needed to be saved across program restart should be in the sch.
 */
const walk = (sch, f, meta = { path: "", level: 1, parent: {} }) => {
  switch (true) {
    case [T.RECORD].includes(sch.type):
      for (let [k, sch_] of Object.entries(sch.fields)) {
        let nextMeta = { path: `${meta.path}[${k}]`, level: meta.level + 1, parent: { _box: sch._box, type: sch.type } }
        sch.fields[k] = walk(sch_, f, nextMeta)
      }
      break
    case [T.TUPLE, T.UNION].includes(sch.type):
      sch.schs.forEach((sch_, i) => {
        let nextMeta = { path: `${meta.path}[][${i}]`, level: meta.level + 1, parent: { _box: sch._box, type: sch.type } }
        sch.schs[i] = walk(sch_, f, nextMeta)
      })
      break
    case [T.LIST].includes(sch.type):
      let nextMeta = { path: `${meta.path}[][0]`, level: meta.level + 1, parent: { _box: sch._box, type: sch.type } }
      sch.sch = walk(sch.sch, f, nextMeta)
      break
    default:
      sch
  }

  return f(sch, meta)
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
  let rawSchs = Object.values(selectedPerParent)
    .flat()
    .map((c, i) => {
      let sch = get(store, c.id)
      if (sch) return { k: c.key, sch: () => clone(sch), index: startIndex + i, id: c.id }
    })
    .filter(c => c && !dstPath.startsWith(c.id))

  let pasted = {}
  let result_ = put(store, dstPath, rawSchs)

  if (result_.inserted.length != 0) pasted[dstPath] = result_.inserted
  return pasted
}

const changeType = (store, path, sch) =>
  update(store, path, (a, m) => a = T.putAnchor(sch, m.parent._box))

const get = (currentNode, path) =>
  getByAndUpdate(currentNode, (a, m) => m.path == path, (a, m) => { a._meta = m; return a })

const update = (currentNode, path, fupdate) =>
  getByAndUpdate(currentNode, (a, m) => m.path == path, fupdate)

const getByAndUpdate = (currentNode, fget, fupdate) => {
  let foundSch
  walk(currentNode, (sch_, meta) => {
    if (fget(sch_, meta)) return foundSch = fupdate(sch_, meta)
    else return sch_
  })
  return foundSch
}
