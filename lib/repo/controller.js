import { controller as sharedController } from "../controllers/file_body.js"

export const router = (projectStore, event) => {
  const bodyExt = event.target.closest("[data-ext]").dataset.ext
  const controller = projectStore.controllers[bodyExt]

  sharedController(projectStore, event.detail)
  controller?.(projectStore, event.detail)
}
