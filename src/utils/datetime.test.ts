import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ceilTimeSeconds, ceilToNextSlot } from './datetime.js'

// HH:MM:SS 文字列を秒数に変換するテスト用ヘルパ
function toSeconds(hhmm: string): number {
  const [h, m, s = 0] = hhmm.split(':').map(Number)
  return h * 3600 + m * 60 + s
}

describe('ceilTimeSeconds', () => {
  it('14:01 → 14:30', () => {
    assert.equal(ceilTimeSeconds(toSeconds('14:01')), '14:30')
  })

  it('14:29 → 14:30', () => {
    assert.equal(ceilTimeSeconds(toSeconds('14:29')), '14:30')
  })

  it('14:30:00 ちょうど → 14:30（次の枠に飛ばさない）', () => {
    assert.equal(ceilTimeSeconds(toSeconds('14:30:00')), '14:30')
  })

  it('14:31 → 15:00', () => {
    assert.equal(ceilTimeSeconds(toSeconds('14:31')), '15:00')
  })

  it('23:41 → 00:00（翌日ロールオーバー）', () => {
    assert.equal(ceilTimeSeconds(toSeconds('23:41')), '00:00')
  })

  it('00:00:00 ちょうど → 00:00', () => {
    assert.equal(ceilTimeSeconds(toSeconds('00:00:00')), '00:00')
  })

  it('23:30:00 ちょうど → 23:30（次の枠に飛ばさない）', () => {
    assert.equal(ceilTimeSeconds(toSeconds('23:30:00')), '23:30')
  })

  it('23:30:01 → 00:00（1秒ずれたらロールオーバー）', () => {
    assert.equal(ceilTimeSeconds(toSeconds('23:30:01')), '00:00')
  })
})

describe('ceilToNextSlot', () => {
  it('値が渡された場合はそのまま返す', () => {
    assert.equal(ceilToNextSlot('12:00'), '12:00')
    assert.equal(ceilToNextSlot('09:45'), '09:45')
  })

  it('undefined の場合は HH:MM 形式のデフォルトを返す', () => {
    const result = ceilToNextSlot(undefined)
    assert.match(result, /^\d{2}:\d{2}$/, `期待 HH:MM 形式, 実際: ${result}`)
  })

  it('null の場合は HH:MM 形式のデフォルトを返す', () => {
    const result = ceilToNextSlot(null)
    assert.match(result, /^\d{2}:\d{2}$/, `期待 HH:MM 形式, 実際: ${result}`)
  })

  it('空文字の場合は HH:MM 形式のデフォルトを返す', () => {
    const result = ceilToNextSlot('')
    assert.match(result, /^\d{2}:\d{2}$/, `期待 HH:MM 形式, 実際: ${result}`)
  })

  it('デフォルト値は30分単位に揃っている', () => {
    const result = ceilToNextSlot()
    const [, mm] = result.split(':').map(Number)
    assert.ok(mm === 0 || mm === 30, `分は0か30のはず, 実際: ${mm}`)
  })
})
