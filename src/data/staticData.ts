import { Timestamp } from 'firebase/firestore';
import type { Cell, ColumnDef, DayValue, MonthValue, Page, YearValue } from './page';
import type { PageApi } from './VirtualPage/types';

interface InitDateValue {
  year?: number;
  month?: number;
  day?: number;
  remark?: string | null;
  precision: string;
}
interface InitCell {
  raw: string;
  value: null | string | InitDateValue;
}
interface InitEdges {
  rows: number[];
  cols: number[];
}
interface InitData {
  idx: number;
  name: string;
  version_id: null | string;
  image: string;
  columns: ColumnDef[];
  cells: InitCell[][];
  edges: InitEdges;
}

const staticData : { [idx: number]: Page } = {};
const staticPromise = import(`${import.meta.env.VITE_STATIC_DATA_PATH}`).then((val : { default : any }) => {
  const rawList : InitData[] = val.default as InitData[]
  for(const rawPage of rawList) {
    staticData[rawPage.idx] = convert(rawPage)
  }
  return staticData
}).catch(e => { 
  console.error('Failed to load static data, bootstrapping data unavailable.', e); 
  return staticData; 
})

function convert_cell(cell : InitCell) : Cell {
  if (!cell.value) {
    return {v: ''}
  }
  if (typeof cell.value === 'string') {
    return {v: cell.value}
  }
  if (['century', 'decade', 'year'].includes(cell.value.precision)) {
    const v : YearValue = { t: cell.value.precision, y: cell.value.year ?? 0, n: cell.value.remark ?? undefined } as YearValue
    return { v }
  }
  if (cell.value.precision == 'month') {
    const v : MonthValue = { t: 'month', y: cell.value.year ?? 0, m: cell.value.month ?? 0, n: cell.value.remark ?? undefined }
    return { v }
  }
  if (cell.value.precision == 'day') {
    const v : DayValue = { t: 'day', y: cell.value.year ?? 0, m: cell.value.month ?? 0, d: cell.value.day ?? 0, n: cell.value.remark ?? undefined }
    return { v }
  }
  console.error('Failed to interpret cell', cell)
  return { v: '' }
}
function convert(base : InitData) : Page {
  return {
    idx: base.idx,
    image: base.image,
    updated: Timestamp.now(),
    contributors: {},
    edges: { x: base.edges.cols, y: base.edges.rows, updated: { by: 'scan', on: Timestamp.now() } },
    cells: base.cells.map(row => row.map(convert_cell))
  }
}

export const staticApi : PageApi = {
  fetch: async (idx: number) => {
    const data = (await staticPromise)[idx];
    if (!data) {
      throw new Error(`Invalid index ${idx}`)
    }
    return data
  },
  try_save: (_t: Timestamp, _p: Page) => {
    throw Error('Not implemented');
  }
}
export const staticFirstPageIdx = 2
export const staticLastPageIdx = 39
export const staticPageCount = staticLastPageIdx - staticFirstPageIdx + 1
export const staticColumns : ColumnDef[] = [
  {
    "id": "gen",
    "label": "Gen",
    "type": "gen"
  },
  {
    "id": "id",
    "label": "ID",
    "type": "id"
  },
  {
    "id": "pmid",
    "label": "PMID",
    "type": "id"
  },
  {
    "id": "5G",
    "label": "5G",
    "type": "id"
  },
  {
    "id": "4G",
    "label": "4G",
    "type": "id"
  },
  {
    "id": "3G",
    "label": "3G",
    "type": "id"
  },
  {
    "id": "2G",
    "label": "2G",
    "type": "id"
  },
  {
    "id": "1G",
    "label": "1G",
    "type": "id"
  },
  {
    "id": "-1g",
    "label": "-1g",
    "type": "id"
  },
  {
    "id": "-2g",
    "label": "-2g",
    "type": "id"
  },
  {
    "id": "-3g",
    "label": "-3g",
    "type": "id"
  },
  {
    "id": "ancestor",
    "label": "Ancestor name",
    "type": "name"
  },
  {
    "id": "given_names",
    "label": "Given names",
    "type": "name"
  },
  {
    "id": "birth_date",
    "label": "Birth date",
    "type": "date"
  },
  {
    "id": "death_date",
    "label": "Death date",
    "type": "date"
  },
  {
    "id": "marry_date",
    "label": "Marr date",
    "type": "date"
  },
  {
    "id": "smid",
    "label": "SMID",
    "type": "id"
  },
  {
    "id": "marry_family_name",
    "label": "Family name (marriage)",
    "type": "name"
  },
  {
    "id": "marry_given_names",
    "label": "Given name (marriage)",
    "type": "name"
  },
  {
    "id": "marry_birth_date",
    "label": "Birth date (marriage)",
    "type": "date"
  },
  {
    "id": "marry_death_date",
    "label": "Death date (marriage)",
    "type": "date"
  }
]