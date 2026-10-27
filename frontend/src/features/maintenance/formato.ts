/** 'AAAA-MM-DD' o 'AAAA-MM-DD HH:MM' → 'DD/MM/AAAA[ HH:MM]'. */
export const fecha = (iso: string) => {
  const [f, h] = iso.split(' ')
  return `${f.split('-').reverse().join('/')}${h ? ` ${h}` : ''}`
}
