import { describe, expect, it } from 'vitest'
import en from './en'
import ru from './ru'
import uz from './uz'

type Tree = { [key: string]: string | Tree }

function leaves(tree: Tree, prefix = ''): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [[prefix + key, value]] : leaves(value, `${prefix}${key}.`),
  )
}

const withoutRussianPlurals = (key: string) => !/_(few|many)$/.test(key)

describe('UI dictionaries', () => {
  const ruKeys = leaves(ru).map(([key]) => key).filter(withoutRussianPlurals).sort()

  it.each([
    ['uz', uz],
    ['en', en],
  ] as const)('%s has the same keys as ru', (_lang, dict) => {
    expect(leaves(dict as Tree).map(([key]) => key).sort()).toEqual(ruKeys)
  })

  it.each([
    ['ru', ru],
    ['uz', uz],
    ['en', en],
  ] as const)('%s has no empty strings', (_lang, dict) => {
    const empty = leaves(dict as Tree).filter(([, value]) => !value.trim())
    expect(empty).toEqual([])
  })
})
