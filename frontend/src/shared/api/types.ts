export type Paginado<T> = {
  data: T[]
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export type Recurso<T> = { data: T }
