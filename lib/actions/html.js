import { insertAfter } from "../actions"
import { text } from "../pkgs/html.js"

export const insertTextNode = ctx => {
  const { tree, store, e } = ctx
  insertAfter(ctx, text)
}
