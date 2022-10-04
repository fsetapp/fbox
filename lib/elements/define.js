export const define = (name, context, domEvents, opts = {}) => {
  const l = { handleEvent: e => handleDomEvent(e, context, domEvents, opts) }

  const off = self => self.off.forEach(d => d())
  const on = (self, domEvents) => {
    self.off = domEvents.map(([k, _]) => {
      self.addEventListener(k, l)
      return () => self.removeEventListener(k, l)
    })
  }

  if (customElements.get(name))
    for (let el of document.querySelectorAll(name)) { off(el); on(el, domEvents) }
  else
    customElements.define(name, class extends HTMLElement {
      connectedCallback() { on(this, domEvents) }
      disconnectedCallback() { off(this) }
    })
}

const handleDomEvent = (e, context, cmds = [], opts = {}) => {
  const { denyFn, preFn, postFn } = opts
  const cmdsMap = new Map(cmds)
  context.e = e

  let cmdsObj = cmdsMap.get(e.type)
  if (!cmdsObj) return

  let preCmd, command, postCmd
  preCmd = cmdsObj.pre
  postCmd = cmdsObj.post

  // -- get
  if (typeof cmdsObj == "function") command = cmdsObj
  if (cmdsObj.kbd) command = (new Map(cmdsObj.kbd)).get(modifiedKey(e))
  if (cmdsObj.selector) {
    let thing = cmdsObj.selector.find(a => e.target.matches(a[0]))?.[1]

    if (typeof thing == "function") command = thing
    else if (thing?.kbd) command = (new Map(thing.kbd)).get(modifiedKey(e))
  }

  // -- execute
  if (command && denyFn?.(context, command)) return
  command && preFn?.(context, command)

  preCmd?.(context)
  command?.(context)
  postCmd?.(context)

  command = command || preCmd || postCmd
  command && postFn?.(context, command)
}

const modifiedKey = ({ shiftKey, metaKey, altKey, ctrlKey, key }) => {
  let cmd = []
  if (shiftKey) cmd.push("shift")
  if (metaKey) cmd.push("meta")
  else if (ctrlKey) cmd.push("meta")
  if (altKey) cmd.push("alt")
  if (key) cmd.push(key)
  return cmd.join("-")
}
