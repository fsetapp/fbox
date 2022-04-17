import * as Core from "./core.js"
import * as Actions from "../actions.js"

export const PKG_NAME = "html"

const { assign } = Object

// https://developer.mozilla.org/en-US/docs/Web/HTML/Element
export const HTML = 0
export const BASE = 1
export const HEAD = 2
export const LINK = 3
export const META = 4
export const STYLE = 5
export const TITLE = 6
export const BODY = 7
export const ADDRESS = 8
export const ARTICLE = 9
export const ASIDE = 10
export const FOOTER = 11
export const HEADER = 12
export const H1 = 13
export const H2 = 14
export const H3 = 15
export const H4 = 16
export const H5 = 17
export const H6 = 18
export const MAIN = 19
export const NAV = 20
export const SECTION = 21
export const BLOCKQUOTE = 22
export const DD = 23
export const DIV = 24
export const DL = 25
export const DT = 26
export const FIGCAPTION = 27
export const FIGURE = 28
export const HR = 29
export const LI = 30
export const MENU = 31
export const OL = 32
export const P = 33
export const PRE = 34
export const UL = 35
export const A = 36
export const ABBR = 37
export const B = 38
export const BDI = 39
export const BDO = 40
export const BR = 41
export const CITE = 42
export const CODE = 43
export const DATA = 44
export const DFN = 45
export const EM = 46
export const I = 47
export const KBD = 48
export const MARK = 49
export const Q = 50
export const RP = 51
export const RT = 52
export const RUBY = 53
export const S = 54
export const SAMP = 55
export const SMALL = 56
export const SPAN = 57
export const STRONG = 58
export const SUB = 59
export const SUP = 60
export const TIME = 61
export const U = 62
export const VAR = 63
export const WBR = 64
export const AREA = 65
export const AUDIO = 66
export const IMG = 67
export const MAP = 68
export const TRACK = 69
export const VIDEO = 70
export const EMBED = 71
export const IFRAME = 72
export const OBJECT = 73
export const PARAM = 74
export const PICTURE = 75
export const PORTAL = 76
export const SOURCE = 77
export const SVG = 78
export const MATH = 79
export const CANVAS = 80
export const NOSCRIPT = 81
export const SCRIPT = 82
export const DEL = 83
export const INS = 84
export const CAPTION = 85
export const COL = 86
export const COLGROUP = 87
export const TABLE = 88
export const TBODY = 89
export const TD = 90
export const TFOOT = 91
export const TH = 92
export const THEAD = 93
export const TR = 94
export const BUTTON = 95
export const DATALIST = 96
export const FIELDSET = 97
export const FORM = 98
export const INPUT = 99
export const LABEL = 100
export const LEGEND = 101
export const METER = 102
export const OPTGROUP = 103
export const OPTION = 104
export const OUTPUT = 105
export const PROGRESS = 106
export const SELECT = 107
export const TEXTAREA = 108
export const DETAILS = 109
export const DIALOG = 110
export const SUMMARY = 111
export const SLOT = 112
export const TEMPLATE = 113
export const TEXT = 114
export const HGROUP = 115

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

const html = (opts) => assign({ t: HTML, schs: [] }, opts)
const base = (opts) => assign({ t: BASE, schs: [] }, opts)
const head = (opts) => assign({ t: HEAD, schs: [] }, opts)
const link = (opts) => assign({ t: LINK, schs: [] }, opts)
const meta = (opts) => assign({ t: META, schs: [] }, opts)
const style = (opts) => assign({ t: STYLE, schs: [] }, opts)
const title = (opts) => assign({ t: TITLE, schs: [] }, opts)
const body = (opts) => assign({ t: BODY, schs: [] }, opts)
const address = (opts) => assign({ t: ADDRESS, schs: [] }, opts)
const article = (opts) => assign({ t: ARTICLE, schs: [] }, opts)
const aside = (opts) => assign({ t: ASIDE, schs: [] }, opts)
const footer = (opts) => assign({ t: FOOTER, schs: [] }, opts)
const header = (opts) => assign({ t: HEADER, schs: [] }, opts)
const h1 = (opts) => assign({ t: H1, schs: [] }, opts)
const h2 = (opts) => assign({ t: H2, schs: [] }, opts)
const h3 = (opts) => assign({ t: H3, schs: [] }, opts)
const h4 = (opts) => assign({ t: H4, schs: [] }, opts)
const h5 = (opts) => assign({ t: H5, schs: [] }, opts)
const h6 = (opts) => assign({ t: H6, schs: [] }, opts)
const main = (opts) => assign({ t: MAIN, schs: [] }, opts)
const nav = (opts) => assign({ t: NAV, schs: [] }, opts)
const section = (opts) => assign({ t: SECTION, schs: [] }, opts)
const blockquote = (opts) => assign({ t: BLOCKQUOTE, schs: [] }, opts)
const dd = (opts) => assign({ t: DD, schs: [] }, opts)
const div = (opts) => assign({ t: DIV, schs: [] }, opts)
const dl = (opts) => assign({ t: DL, schs: [] }, opts)
const dt = (opts) => assign({ t: DT, schs: [] }, opts)
const figcaption = (opts) => assign({ t: FIGCAPTION, schs: [] }, opts)
const figure = (opts) => assign({ t: FIGURE, schs: [] }, opts)
const hr = (opts) => assign({ t: HR, schs: [] }, opts)
const li = (opts) => assign({ t: LI, schs: [] }, opts)
const menu = (opts) => assign({ t: MENU, schs: [] }, opts)
const ol = (opts) => assign({ t: OL, schs: [] }, opts)
const p = (opts) => assign({ t: P, schs: [] }, opts)
const pre = (opts) => assign({ t: PRE, schs: [] }, opts)
const ul = (opts) => assign({ t: UL, schs: [] }, opts)
const a = (opts) => assign({ t: A, schs: [] }, opts)
const abbr = (opts) => assign({ t: ABBR, schs: [] }, opts)
const b = (opts) => assign({ t: B, schs: [] }, opts)
const bdi = (opts) => assign({ t: BDI, schs: [] }, opts)
const bdo = (opts) => assign({ t: BDO, schs: [] }, opts)
const br = (opts) => assign({ t: BR, schs: [] }, opts)
const cite = (opts) => assign({ t: CITE, schs: [] }, opts)
const code = (opts) => assign({ t: CODE, schs: [] }, opts)
const data = (opts) => assign({ t: DATA, schs: [] }, opts)
const dfn = (opts) => assign({ t: DFN, schs: [] }, opts)
const em = (opts) => assign({ t: EM, schs: [] }, opts)
const i = (opts) => assign({ t: I, schs: [] }, opts)
const kbd = (opts) => assign({ t: KBD, schs: [] }, opts)
const mark = (opts) => assign({ t: MARK, schs: [] }, opts)
const q = (opts) => assign({ t: Q, schs: [] }, opts)
const rp = (opts) => assign({ t: RP, schs: [] }, opts)
const rt = (opts) => assign({ t: RT, schs: [] }, opts)
const ruby = (opts) => assign({ t: RUBY, schs: [] }, opts)
const s = (opts) => assign({ t: S, schs: [] }, opts)
const samp = (opts) => assign({ t: SAMP, schs: [] }, opts)
const small = (opts) => assign({ t: SMALL, schs: [] }, opts)
const span = (opts) => assign({ t: SPAN, schs: [] }, opts)
const strong = (opts) => assign({ t: STRONG, schs: [] }, opts)
const sub = (opts) => assign({ t: SUB, schs: [] }, opts)
const sup = (opts) => assign({ t: SUP, schs: [] }, opts)
const time = (opts) => assign({ t: TIME, schs: [] }, opts)
const u = (opts) => assign({ t: U, schs: [] }, opts)
const var_ = (opts) => assign({ t: VAR, schs: [] }, opts)
const wbr = (opts) => assign({ t: WBR, schs: [] }, opts)
const area = (opts) => assign({ t: AREA, schs: [] }, opts)
const audio = (opts) => assign({ t: AUDIO, schs: [] }, opts)
const img = (opts) => assign({ t: IMG, schs: [] }, opts)
const map = (opts) => assign({ t: MAP, schs: [] }, opts)
const track = (opts) => assign({ t: TRACK, schs: [] }, opts)
const video = (opts) => assign({ t: VIDEO, schs: [] }, opts)
const embed = (opts) => assign({ t: EMBED, schs: [] }, opts)
const iframe = (opts) => assign({ t: IFRAME, schs: [] }, opts)
const object = (opts) => assign({ t: OBJECT, schs: [] }, opts)
const param = (opts) => assign({ t: PARAM, schs: [] }, opts)
const picture = (opts) => assign({ t: PICTURE, schs: [] }, opts)
const portal = (opts) => assign({ t: PORTAL, schs: [] }, opts)
const source = (opts) => assign({ t: SOURCE, schs: [] }, opts)
const svg = (opts) => assign({ t: SVG, schs: [] }, opts)
const math = (opts) => assign({ t: MATH, schs: [] }, opts)
const canvas = (opts) => assign({ t: CANVAS, schs: [] }, opts)
const noscript = (opts) => assign({ t: NOSCRIPT, schs: [] }, opts)
const script = (opts) => assign({ t: SCRIPT, schs: [] }, opts)
const del = (opts) => assign({ t: DEL, schs: [] }, opts)
const ins = (opts) => assign({ t: INS, schs: [] }, opts)
const caption = (opts) => assign({ t: CAPTION, schs: [] }, opts)
const col = (opts) => assign({ t: COL, schs: [] }, opts)
const colgroup = (opts) => assign({ t: COLGROUP, schs: [] }, opts)
const table = (opts) => assign({ t: TABLE, schs: [] }, opts)
const tbody = (opts) => assign({ t: TBODY, schs: [] }, opts)
const td = (opts) => assign({ t: TD, schs: [] }, opts)
const tfoot = (opts) => assign({ t: TFOOT, schs: [] }, opts)
const th = (opts) => assign({ t: TH, schs: [] }, opts)
const thead = (opts) => assign({ t: THEAD, schs: [] }, opts)
const tr = (opts) => assign({ t: TR, schs: [] }, opts)
const button = (opts) => assign({ t: BUTTON, schs: [] }, opts)
const datalist = (opts) => assign({ t: DATALIST, schs: [] }, opts)
const fieldset = (opts) => assign({ t: FIELDSET, schs: [] }, opts)
const form = (opts) => assign({ t: FORM, schs: [] }, opts)
const input = (opts) => assign({ t: INPUT, schs: [] }, opts)
const label = (opts) => assign({ t: LABEL, schs: [] }, opts)
const legend = (opts) => assign({ t: LEGEND, schs: [] }, opts)
const meter = (opts) => assign({ t: METER, schs: [] }, opts)
const optgroup = (opts) => assign({ t: OPTGROUP, schs: [] }, opts)
const option = (opts) => assign({ t: OPTION, schs: [] }, opts)
const output = (opts) => assign({ t: OUTPUT, schs: [] }, opts)
const progress = (opts) => assign({ t: PROGRESS, schs: [] }, opts)
const select = (opts) => assign({ t: SELECT, schs: [] }, opts)
const textarea = (opts) => assign({ t: TEXTAREA, schs: [] }, opts)
const details = (opts) => assign({ t: DETAILS, schs: [] }, opts)
const dialog = (opts) => assign({ t: DIALOG, schs: [] }, opts)
const summary = (opts) => assign({ t: SUMMARY, schs: [] }, opts)
const slot = (opts) => assign({ t: SLOT, schs: [] }, opts)
const template = (opts) => assign({ t: TEMPLATE, schs: [], opts })
const text = (opts) => assign({ t: TEXT, schs: [], opts })
const hgroup = (opts) => assign({ t: HGROUP, schs: [], opts })

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
  html, base, head, link, meta, style, title, body, address, article, aside, footer, header,
  h1, h2, h3, h4, h5, h6, main, nav, section, blockquote, dd, div, dl, dt, figcaption, figure, hr,
  li, menu, ol, p, pre, ul, a, abbr, b, bdi, bdo, br, cite, code, data, dfn, em, i, kbd, mark, q, rp,
  rt, ruby, s, samp, small, span, strong, sub, sup, time, u, var_, wbr, area, audio, img, map, track, video, embed,
  iframe, object, param, picture, portal, source, svg, math, canvas, noscript, script, del, ins, caption,
  col, colgroup, table, tbody, td, tfoot, th, thead, tr, button, datalist, fieldset, form, input, label, legend,
  meter, optgroup, option, output, progress, select, textarea, details, dialog, summary, slot, template, text
]

export const tops = [html({ key: "entry", tag: Core.TOPLV_TAG })]

const sheet = [
  {
    selector: [["t", HEAD]],
    rules: {
      self: {
        exceptActions: [Actions.reorderDown],
      },
      children: {
        allowedSchs: [title({ n: 1 }), base(), link(), meta(), style()]
      }
    }
  },
  {
    selector: [["t", HTML]],
    rules: {
      nthChild: {
        0: { allowedSchs: [head()] },
        1: { allowedSchs: [body()] }
      }
    }
  },
  {
    selector: true,
    rules: {
      children: {
        allowedSchs: all.map(a => a())
      }
    }
  }
]


export const structSheet = { sheet, toStr }
