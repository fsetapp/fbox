export const define = (name, context, domEvents, opts = {}) => {
  context.ref = {}

  const handler = { handleEvent: e => { handleDomEvent(e, context, domEvents, opts) } }
  const on = (self, domEvents) => {
    self.off = []
    self.handler = handler
    for (let [k, _] of domEvents) {
      self.addEventListener(k, self.handler)
      self.off.push(() => self.removeEventListener(k, self.handler))
    }
  }

  const off = self => self.off.forEach(d => d())

  if (customElements.get(name))
    for (let el of document.querySelectorAll(name)) {
      off(el)
      on(el, domEvents)
    }
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
  let preCmd, command, postCmd

  if (!cmdsObj) return
  preCmd = cmdsObj.pre
  postCmd = cmdsObj.post

  if (cmdsObj.kbd) {
    let kbdMap = new Map(cmdsObj.kbd)
    command = kbdMap.get(modifiedKey(e))
  }
  if (cmdsObj.selector) {
    let cmdsObj_ = cmdsObj.selector.find(a => e.target.matches(a[0]))?.[1]

    switch (true) {
      case typeof cmdsObj_ == "function":
        command = cmdsObj_
        break
      case !!cmdsObj_?.kbd:
        let cmdMap = new Map(cmdsObj_.kbd)
        command = cmdMap.get(modifiedKey(e))
        break
    }
  }
  if (typeof cmdsObj == "function")
    command = cmdsObj

  // ------------------------------
  command && preFn?.(context, command)
  if (command && denyFn?.(context, command)) return

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
