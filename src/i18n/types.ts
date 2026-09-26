import type ru from './ru'

// Russian has extra plural forms (_few, _many); other languages only need _one and _other.
type RussianOnlyPlural = `${string}_few` | `${string}_many`

type Shape<T> = {
  [K in keyof T as K extends RussianOnlyPlural ? never : K]: T[K] extends string ? string : Shape<T[K]>
} & {
  [K in keyof T as K extends RussianOnlyPlural ? K : never]?: string
}

/** Every UI dictionary must provide the same keys as the Russian one. */
export type Dict = Shape<typeof ru>
