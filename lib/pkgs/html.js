import * as Core from "./core.js"
import * as Actions from "../actions.js"
import { s as s_ } from "./registry.js"

export const PKG_NAME = "html"
const MODULE = s_({ PKG_NAME }).t

const ctor = (ctor_, opts) => Object.assign(ctor_, { m: MODULE }, opts)

// https://developer.mozilla.org/en-US/docs/Web/HTML/Element
const HTML = 0
const BASE = 1
const HEAD = 2
const LINK = 3
const META = 4
const STYLE = 5
const TITLE = 6
const BODY = 7
const ADDRESS = 8
const ARTICLE = 9
const ASIDE = 10
const FOOTER = 11
const HEADER = 12
const H1 = 13
const H2 = 14
const H3 = 15
const H4 = 16
const H5 = 17
const H6 = 18
const MAIN = 19
const NAV = 20
const SECTION = 21
const BLOCKQUOTE = 22
const DD = 23
const DIV = 24
const DL = 25
const DT = 26
const FIGCAPTION = 27
const FIGURE = 28
const HR = 29
const LI = 30
const MENU = 31
const OL = 32
const P = 33
const PRE = 34
const UL = 35
const A = 36
const ABBR = 37
const B = 38
const BDI = 39
const BDO = 40
const BR = 41
const CITE = 42
const CODE = 43
const DATA = 44
const DFN = 45
const EM = 46
const I = 47
const KBD = 48
const MARK = 49
const Q = 50
const RP = 51
const RT = 52
const RUBY = 53
const S = 54
const SAMP = 55
const SMALL = 56
const SPAN = 57
const STRONG = 58
const SUB = 59
const SUP = 60
const TIME = 61
const U = 62
const VAR = 63
const WBR = 64
const AREA = 65
const AUDIO = 66
const IMG = 67
const MAP = 68
const TRACK = 69
const VIDEO = 70
const EMBED = 71
const IFRAME = 72
const OBJECT = 73
const PARAM = 74
const PICTURE = 75
const PORTAL = 76
const SOURCE = 77
const SVG = 78
const MATH = 79
const CANVAS = 80
const NOSCRIPT = 81
const SCRIPT = 82
const DEL = 83
const INS = 84
const CAPTION = 85
const COL = 86
const COLGROUP = 87
const TABLE = 88
const TBODY = 89
const TD = 90
const TFOOT = 91
const TH = 92
const THEAD = 93
const TR = 94
const BUTTON = 95
const DATALIST = 96
const FIELDSET = 97
const FORM = 98
const INPUT = 99
const LABEL = 100
const LEGEND = 101
const METER = 102
const OPTGROUP = 103
const OPTION = 104
const OUTPUT = 105
const PROGRESS = 106
const SELECT = 107
const TEXTAREA = 108
const DETAILS = 109
const DIALOG = 110
const SUMMARY = 111
const SLOT = 112
const TEMPLATE = 113
const HGROUP = 114 // 0x72
// remaining reserve: 76 (0x73 - 0xBE)
const TEXT = 191 // 0xBF

const ATTRS = 192 // 0xC0

const toStr = t => tstr[t]
const tstr = {
  [HTML]: "html",
  [BASE]: "base",
  [HEAD]: "head",
  [LINK]: "link",
  [META]: "meta",
  [STYLE]: "style",
  [TITLE]: "title",
  [BODY]: "body",
  [ADDRESS]: "address",
  [ARTICLE]: "article",
  [ASIDE]: "aside",
  [FOOTER]: "footer",
  [HEADER]: "header",
  [H1]: "h1",
  [H2]: "h2",
  [H3]: "h3",
  [H4]: "h4",
  [H5]: "h5",
  [H6]: "h6",
  [MAIN]: "main",
  [NAV]: "nav",
  [SECTION]: "section",
  [BLOCKQUOTE]: "blockquote",
  [DD]: "dd",
  [DIV]: "div",
  [DL]: "dl",
  [DT]: "dt",
  [FIGCAPTION]: "figcaption",
  [FIGURE]: "figure",
  [HR]: "hr",
  [LI]: "li",
  [MENU]: "menu",
  [OL]: "ol",
  [P]: "p",
  [PRE]: "pre",
  [UL]: "ul",
  [A]: "a",
  [ABBR]: "abbr",
  [B]: "b",
  [BDI]: "bdi",
  [BDO]: "bdo",
  [BR]: "br",
  [CITE]: "cite",
  [CODE]: "code",
  [DATA]: "data",
  [DFN]: "dfn",
  [EM]: "em",
  [I]: "i",
  [KBD]: "kbd",
  [MARK]: "mark",
  [Q]: "q",
  [RP]: "rp",
  [RT]: "rt",
  [RUBY]: "ruby",
  [S]: "s",
  [SAMP]: "samp",
  [SMALL]: "small",
  [SPAN]: "span",
  [STRONG]: "strong",
  [SUB]: "sub",
  [SUP]: "sup",
  [TIME]: "time",
  [U]: "u",
  [VAR]: "var",
  [WBR]: "wbr",
  [AREA]: "area",
  [AUDIO]: "audio",
  [IMG]: "img",
  [MAP]: "map",
  [TRACK]: "track",
  [VIDEO]: "video",
  [EMBED]: "embed",
  [IFRAME]: "iframe",
  [OBJECT]: "object",
  [PARAM]: "param",
  [PICTURE]: "picture",
  [PORTAL]: "portal",
  [SOURCE]: "source",
  [SVG]: "svg",
  [MATH]: "math",
  [CANVAS]: "canvas",
  [NOSCRIPT]: "noscript",
  [SCRIPT]: "script",
  [DEL]: "del",
  [INS]: "ins",
  [CAPTION]: "caption",
  [COL]: "col",
  [COLGROUP]: "colgroup",
  [TABLE]: "table",
  [TBODY]: "tbody",
  [TD]: "td",
  [TFOOT]: "tfoot",
  [TH]: "th",
  [THEAD]: "thead",
  [TR]: "tr",
  [BUTTON]: "button",
  [DATALIST]: "datalist",
  [FIELDSET]: "fieldset",
  [FORM]: "form",
  [INPUT]: "input",
  [LABEL]: "label",
  [LEGEND]: "legend",
  [METER]: "meter",
  [OPTGROUP]: "optgroup",
  [OPTION]: "option",
  [OUTPUT]: "output",
  [PROGRESS]: "progress",
  [SELECT]: "select",
  [TEXTAREA]: "textarea",
  [DETAILS]: "details",
  [DIALOG]: "dialog",
  [SUMMARY]: "summary",
  [SLOT]: "slot",
  [TEMPLATE]: "template",
  [TEXT]: "text",
  [HGROUP]: "hgroup",
}

const html = (opts) => ctor({ t: HTML, schs: [] }, opts)
const base = (opts) => ctor({ t: BASE, schs: [] }, opts)
const head = (opts) => ctor({ t: HEAD, schs: [] }, opts)
const link = (opts) => ctor({ t: LINK, schs: [] }, opts)
const meta = (opts) => ctor({ t: META, schs: [] }, opts)
const style = (opts) => ctor({ t: STYLE, schs: [] }, opts)
const title = (opts) => ctor({ t: TITLE, schs: [] }, opts)
const body = (opts) => ctor({ t: BODY, schs: [] }, opts)
const address = (opts) => ctor({ t: ADDRESS, schs: [] }, opts)
const article = (opts) => ctor({ t: ARTICLE, schs: [] }, opts)
const aside = (opts) => ctor({ t: ASIDE, schs: [] }, opts)
const footer = (opts) => ctor({ t: FOOTER, schs: [] }, opts)
const header = (opts) => ctor({ t: HEADER, schs: [] }, opts)
const h1 = (opts) => ctor({ t: H1, schs: [] }, opts)
const h2 = (opts) => ctor({ t: H2, schs: [] }, opts)
const h3 = (opts) => ctor({ t: H3, schs: [] }, opts)
const h4 = (opts) => ctor({ t: H4, schs: [] }, opts)
const h5 = (opts) => ctor({ t: H5, schs: [] }, opts)
const h6 = (opts) => ctor({ t: H6, schs: [] }, opts)
const main = (opts) => ctor({ t: MAIN, schs: [] }, opts)
const nav = (opts) => ctor({ t: NAV, schs: [] }, opts)
const section = (opts) => ctor({ t: SECTION, schs: [] }, opts)
const blockquote = (opts) => ctor({ t: BLOCKQUOTE, schs: [] }, opts)
const dd = (opts) => ctor({ t: DD, schs: [] }, opts)
const div = (opts) => ctor({ t: DIV, schs: [] }, opts)
const dl = (opts) => ctor({ t: DL, schs: [] }, opts)
const dt = (opts) => ctor({ t: DT, schs: [] }, opts)
const figcaption = (opts) => ctor({ t: FIGCAPTION, schs: [] }, opts)
const figure = (opts) => ctor({ t: FIGURE, schs: [] }, opts)
const hr = (opts) => ctor({ t: HR, schs: [] }, opts)
const li = (opts) => ctor({ t: LI, schs: [] }, opts)
const menu = (opts) => ctor({ t: MENU, schs: [] }, opts)
const ol = (opts) => ctor({ t: OL, schs: [] }, opts)
const p = (opts) => ctor({ t: P, schs: [] }, opts)
const pre = (opts) => ctor({ t: PRE, schs: [] }, opts)
const ul = (opts) => ctor({ t: UL, schs: [] }, opts)
const a = (opts) => ctor({ t: A, schs: [] }, opts)
const abbr = (opts) => ctor({ t: ABBR, schs: [] }, opts)
const b = (opts) => ctor({ t: B, schs: [] }, opts)
const bdi = (opts) => ctor({ t: BDI, schs: [] }, opts)
const bdo = (opts) => ctor({ t: BDO, schs: [] }, opts)
const br = (opts) => ctor({ t: BR, schs: [] }, opts)
const cite = (opts) => ctor({ t: CITE, schs: [] }, opts)
const code = (opts) => ctor({ t: CODE, schs: [] }, opts)
const data = (opts) => ctor({ t: DATA, schs: [] }, opts)
const dfn = (opts) => ctor({ t: DFN, schs: [] }, opts)
const em = (opts) => ctor({ t: EM, schs: [] }, opts)
const i = (opts) => ctor({ t: I, schs: [] }, opts)
const kbd = (opts) => ctor({ t: KBD, schs: [] }, opts)
const mark = (opts) => ctor({ t: MARK, schs: [] }, opts)
const q = (opts) => ctor({ t: Q, schs: [] }, opts)
const rp = (opts) => ctor({ t: RP, schs: [] }, opts)
const rt = (opts) => ctor({ t: RT, schs: [] }, opts)
const ruby = (opts) => ctor({ t: RUBY, schs: [] }, opts)
const s = (opts) => ctor({ t: S, schs: [] }, opts)
const samp = (opts) => ctor({ t: SAMP, schs: [] }, opts)
const small = (opts) => ctor({ t: SMALL, schs: [] }, opts)
const span = (opts) => ctor({ t: SPAN, schs: [] }, opts)
const strong = (opts) => ctor({ t: STRONG, schs: [] }, opts)
const sub = (opts) => ctor({ t: SUB, schs: [] }, opts)
const sup = (opts) => ctor({ t: SUP, schs: [] }, opts)
const time = (opts) => ctor({ t: TIME, schs: [] }, opts)
const u = (opts) => ctor({ t: U, schs: [] }, opts)
const var_ = (opts) => ctor({ t: VAR, schs: [] }, opts)
const wbr = (opts) => ctor({ t: WBR, schs: [] }, opts)
const area = (opts) => ctor({ t: AREA, schs: [] }, opts)
const audio = (opts) => ctor({ t: AUDIO, schs: [] }, opts)
const img = (opts) => ctor({ t: IMG, schs: [] }, opts)
const map = (opts) => ctor({ t: MAP, schs: [] }, opts)
const track = (opts) => ctor({ t: TRACK, schs: [] }, opts)
const video = (opts) => ctor({ t: VIDEO, schs: [] }, opts)
const embed = (opts) => ctor({ t: EMBED, schs: [] }, opts)
const iframe = (opts) => ctor({ t: IFRAME, schs: [] }, opts)
const object = (opts) => ctor({ t: OBJECT, schs: [] }, opts)
const param = (opts) => ctor({ t: PARAM, schs: [] }, opts)
const picture = (opts) => ctor({ t: PICTURE, schs: [] }, opts)
const portal = (opts) => ctor({ t: PORTAL, schs: [] }, opts)
const source = (opts) => ctor({ t: SOURCE, schs: [] }, opts)
const svg = (opts) => ctor({ t: SVG, schs: [] }, opts)
const math = (opts) => ctor({ t: MATH, schs: [] }, opts)
const canvas = (opts) => ctor({ t: CANVAS, schs: [] }, opts)
const noscript = (opts) => ctor({ t: NOSCRIPT, schs: [] }, opts)
const script = (opts) => ctor({ t: SCRIPT, schs: [] }, opts)
const del = (opts) => ctor({ t: DEL, schs: [] }, opts)
const ins = (opts) => ctor({ t: INS, schs: [] }, opts)
const caption = (opts) => ctor({ t: CAPTION, schs: [] }, opts)
const col = (opts) => ctor({ t: COL, schs: [] }, opts)
const colgroup = (opts) => ctor({ t: COLGROUP, schs: [] }, opts)
const table = (opts) => ctor({ t: TABLE, schs: [] }, opts)
const tbody = (opts) => ctor({ t: TBODY, schs: [] }, opts)
const td = (opts) => ctor({ t: TD, schs: [] }, opts)
const tfoot = (opts) => ctor({ t: TFOOT, schs: [] }, opts)
const th = (opts) => ctor({ t: TH, schs: [] }, opts)
const thead = (opts) => ctor({ t: THEAD, schs: [] }, opts)
const tr = (opts) => ctor({ t: TR, schs: [] }, opts)
const button = (opts) => ctor({ t: BUTTON, schs: [] }, opts)
const datalist = (opts) => ctor({ t: DATALIST, schs: [] }, opts)
const fieldset = (opts) => ctor({ t: FIELDSET, schs: [] }, opts)
const form = (opts) => ctor({ t: FORM, schs: [] }, opts)
const input = (opts) => ctor({ t: INPUT, schs: [] }, opts)
const label = (opts) => ctor({ t: LABEL, schs: [] }, opts)
const legend = (opts) => ctor({ t: LEGEND, schs: [] }, opts)
const meter = (opts) => ctor({ t: METER, schs: [] }, opts)
const optgroup = (opts) => ctor({ t: OPTGROUP, schs: [] }, opts)
const option = (opts) => ctor({ t: OPTION, schs: [] }, opts)
const output = (opts) => ctor({ t: OUTPUT, schs: [] }, opts)
const progress = (opts) => ctor({ t: PROGRESS, schs: [] }, opts)
const select = (opts) => ctor({ t: SELECT, schs: [] }, opts)
const textarea = (opts) => ctor({ t: TEXTAREA, schs: [] }, opts)
const details = (opts) => ctor({ t: DETAILS, schs: [] }, opts)
const dialog = (opts) => ctor({ t: DIALOG, schs: [] }, opts)
const summary = (opts) => ctor({ t: SUMMARY, schs: [] }, opts)
const slot = (opts) => ctor({ t: SLOT, schs: [] }, opts)
const template = (opts) => ctor({ t: TEMPLATE, schs: [] }, opts)
const hgroup = (opts) => ctor({ t: HGROUP, schs: [] }, opts)

export const text = (opts) => ctor({ t: TEXT, v: "" }, opts)
const attrs = (opts) => ctor({ t: ATTRS, schs: [] }, opts)

/* Categories
  https://html.spec.whatwg.org/multipage/indices.html#elements-3
  TODO:
    - autonomous custom elements
    - form-associated custom elements
    - SVG svg
    - MathML math

  // Code to extract
  const col = (c, n) => c.querySelector(`:scope > td:nth-child(${n})`).textContent.replace(/\s/g, "").split(";")
  Array.from(temp1.querySelectorAll(":scope > tr")).map(a => ({
    tag: a.querySelector("th").textContent,
    categories: col(a, 3),
    parents: col(a, 4),
    children: col(a, 5),
    attrs: col(a, 6)
  }))
*/

const metadataContent = [base, link, meta, noscript, script, style, template, title]
const flowContent = [
  a, abbr, address, article, aside, audio, b, bdi, bdo, blockquote, br, button, canvas,
  cite, code, data, datalist, del, details, dfn, dialog, div, dl, em, embed, fieldset,
  figure, footer, form, h1, h2, h3, h4, h5, h6, header, hgroup, hr, i, iframe, img, input,
  ins, kbd, label, map, mark, menu, meter, nav, noscript, object, ol, output,
  p, picture, pre, progress, q, ruby, s, samp, script, section, select, slot, small, span,
  strong, sub, sup, svg, table, template, textarea, time, u, ul, var_, video, wbr, text
]
const sectioningContent = [article, aside, nav, section]
const headingContent = [h1, h2, h3, h4, h5, h6, hgroup]
const phrasingContent = [
  a, abbr, audio, b, bdi, bdo, br, button, canvas, cite, code, data, datalist, del, dfn,
  em, embed, i, iframe, img, input, ins, kbd, label, map, mark, meter, noscript,
  object, output, picture, progress, q, ruby, s, samp, script, select, slot, small, span, strong,
  sub, sup, svg, template, textarea, time, u, var_, video, wbr, text
]
const embeddedContent = [audio, canvas, embed, iframe, img, object, picture, svg, video]
const interactiveContent = [button, details, embed, iframe, label, select, textarea]
const sectioningRoots = [blockquote, body, details, dialog, fieldset, figure, td]
const formSssociatedElements = [button, fieldset, input, label, object, output, select, textarea, img]
const listedElements = [button, fieldset, input, object, output, select, textarea]
const submittableElements = [button, input, select, textarea]
const autocapitalizeInheritingElements = [button, fieldset, input, output, select, textarea]
const labelableElements = [button, input, meter, output, progress, select, textarea]
const palpableContent = [
  a, abbr, address, article, aside, b, bdi, bdo, blockquote, button, canvas, cite, code, data,
  details, dfn, div, em, embed, fieldset, figure, footer, form, h1, h2, h3, h4, h5, h6, header, hgroup,
  i, iframe, img, ins, kbd, label, main, map, mark, meter, nav, object, output, p, pre, progress,
  q, ruby, s, samp, section, select, small, span, strong, sub, sup, svg, table, textarea, time, u, var_, video
]
const scriptSupportingElements = [script, template]

const all = [
  text, html, base, head, link, meta, style, title, body, address, article, aside, footer, header,
  h1, h2, h3, h4, h5, h6, main, nav, section, blockquote, dd, div, dl, dt, figcaption, figure, hr,
  li, menu, ol, p, pre, ul, a, abbr, b, bdi, bdo, br, cite, code, data, dfn, em, i, kbd, mark, q, rp,
  rt, ruby, s, samp, small, span, strong, sub, sup, time, u, var_, wbr, area, audio, img, map, track, video, embed,
  iframe, object, param, picture, portal, source, svg, math, canvas, noscript, script, del, ins, caption,
  col, colgroup, table, tbody, td, tfoot, th, thead, tr, button, datalist, fieldset, form, input, label, legend,
  meter, optgroup, option, output, progress, select, textarea, details, dialog, summary, slot, template
]

export const tops = [html({ key: "entry", tag: Core.TOPLV_TAG })]

// Sheet structural rules is like type signature where children is mostly union type.
const sheet = t => lookup[t] || lookup["default"]
const lookup = {
  [HTML]: {
    nthChild: {
      0: { allowedSchs: [head({ n: 1 })] },
      1: { allowedSchs: [body({ n: 1 })] }
    }
  },
  [HEAD]: {
    self: {
      exceptActions: [Actions.reorderDown],
    },
    children: {
      allowedSchs: [title({ n: 1 }), base(), link(), meta(), style(), script()]
    }
  },
  [TITLE]: {
    children: { allowedSchs: [] }
  },
  ["default"]: {
    children: {
      allowedSchs: all.map(a => a())
    }
  }
}

export const structSheet = { sheet, toStr }
