import { controller as controller_, changeFile } from "../../controllers/project.js"

export { FileTree, renderFileNav } from "../../elements/file_tree.js"
export { controller, changeFile }

const extstr = "project"
const controller = { [extstr]: controller_ }
