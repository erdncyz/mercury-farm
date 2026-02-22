import { toSentenceCase } from './to-sentence-case.util'

describe('toSentenceCase util', () => {
  test('lower case', () => {
    expect(toSentenceCase('abc')).toBe('Abc')
  })

  test('upper case', () => {
    expect(toSentenceCase('ABC')).toBe('Abc')
  })
})
