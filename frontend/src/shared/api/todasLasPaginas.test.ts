import { mockFetch } from '@/test/render'
import { todasLasPaginas } from './todasLasPaginas'

afterEach(() => vi.unstubAllGlobals())

const pagina = (n: number, ids: number[], ultima: number) => ({
  status: 200, body: { data: ids.map((id) => ({ id })), meta: { current_page: n, last_page: ultima, per_page: 100, total: 250 } },
})

describe('todasLasPaginas (spec 08, H-08.2)', () => {
  it('trae todas las páginas, no solo las primeras 100 opciones', async () => {
    const llamadas = mockFetch({
      'GET /machinery?estado=todos&per_page=100&page=1': pagina(1, [1, 2], 3),
      'GET /machinery?estado=todos&per_page=100&page=2': pagina(2, [3], 3),
      'GET /machinery?estado=todos&per_page=100&page=3': pagina(3, [4], 3),
    })
    expect((await todasLasPaginas<{ id: number }>('/machinery?estado=todos')).map((u) => u.id)).toEqual([1, 2, 3, 4])
    expect(llamadas).toHaveLength(3)
  })

  it('con una sola página hace una sola consulta', async () => {
    const llamadas = mockFetch({ 'GET /users?per_page=100&page=1': pagina(1, [7], 1) })
    expect(await todasLasPaginas('/users')).toEqual([{ id: 7 }])
    expect(llamadas).toHaveLength(1)
  })
})
