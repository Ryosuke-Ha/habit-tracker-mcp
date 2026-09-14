import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { LIMITS } from './limits.js'
import {
  addTodoSchema,
  completeTodoSchema,
  addScheduledTodoSchema,
  addPersistentTodoSchema,
} from '../tools/todos.js'
import { addKptItemSchema } from '../tools/reviews.js'

// ──────────────────────────────────────────────────────────────────────────────
// add_todo
// ──────────────────────────────────────────────────────────────────────────────
describe('addTodoSchema', () => {
  it('正常系: 最小入力', () => {
    const r = addTodoSchema.safeParse({ title: 'テスト' })
    assert.ok(r.success)
  })

  it('正常系: title が境界値ちょうど（TITLE_MAX 文字）', () => {
    const r = addTodoSchema.safeParse({ title: 'a'.repeat(LIMITS.TITLE_MAX) })
    assert.ok(r.success)
  })

  it('異常系: title が上限+1 文字', () => {
    const input = 'a'.repeat(LIMITS.TITLE_MAX + 1)
    const r = addTodoSchema.safeParse({ title: input })
    assert.ok(!r.success)
    const msg = r.error!.issues[0].message
    assert.match(msg, /200/, `上限値がメッセージに含まれていない: ${msg}`)
    assert.match(msg, new RegExp(`入力${input.length}文字`), `実測値がメッセージに含まれていない: ${msg}`)
    assert.match(msg, /再実行/, `「再実行」がメッセージに含まれていない: ${msg}`)
  })

  it('異常系: title が空文字', () => {
    const r = addTodoSchema.safeParse({ title: '' })
    assert.ok(!r.success)
  })

  it('異常系: title が空白のみ', () => {
    const r = addTodoSchema.safeParse({ title: '   ' })
    assert.ok(!r.success)
  })

  it('正常系: location が境界値ちょうど（LOCATION_MAX 文字）', () => {
    const r = addTodoSchema.safeParse({ title: 'テスト', location: 'a'.repeat(LIMITS.LOCATION_MAX) })
    assert.ok(r.success)
  })

  it('異常系: location が上限+1 文字', () => {
    const input = 'a'.repeat(LIMITS.LOCATION_MAX + 1)
    const r = addTodoSchema.safeParse({ title: 'テスト', location: input })
    assert.ok(!r.success)
    const msg = r.error!.issues[0].message
    assert.match(msg, /100/)
    assert.match(msg, new RegExp(`入力${input.length}文字`), `実測値がメッセージに含まれていない: ${msg}`)
    assert.match(msg, /再実行/)
  })

  it('正常系: scheduled_time が有効な HH:MM', () => {
    for (const t of ['00:00', '09:30', '12:00', '23:59']) {
      const r = addTodoSchema.safeParse({ title: 'テスト', scheduled_time: t })
      assert.ok(r.success, `${t} は有効なはず`)
    }
  })

  it('異常系: scheduled_time が "25:00"（時が範囲外）', () => {
    const r = addTodoSchema.safeParse({ title: 'テスト', scheduled_time: '25:00' })
    assert.ok(!r.success)
    assert.match(r.error!.issues[0].message, /再実行/)
  })

  it('異常系: scheduled_time が "9:5"（ゼロ埋めなし）', () => {
    const r = addTodoSchema.safeParse({ title: 'テスト', scheduled_time: '9:5' })
    assert.ok(!r.success)
  })

  it('異常系: scheduled_time が "あ"（非ASCII）', () => {
    const r = addTodoSchema.safeParse({ title: 'テスト', scheduled_time: 'あ' })
    assert.ok(!r.success)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// complete_todo
// ──────────────────────────────────────────────────────────────────────────────
describe('completeTodoSchema', () => {
  it('正常系: 正の整数 ID', () => {
    assert.ok(completeTodoSchema.safeParse({ todo_id: 1 }).success)
    assert.ok(completeTodoSchema.safeParse({ todo_id: 999 }).success)
  })

  it('異常系: todo_id が 0', () => {
    const r = completeTodoSchema.safeParse({ todo_id: 0 })
    assert.ok(!r.success)
    assert.match(r.error!.issues[0].message, /再実行/)
  })

  it('異常系: todo_id が負数', () => {
    const r = completeTodoSchema.safeParse({ todo_id: -1 })
    assert.ok(!r.success)
  })

  it('異常系: todo_id が小数', () => {
    const r = completeTodoSchema.safeParse({ todo_id: 1.5 })
    assert.ok(!r.success)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// add_scheduled_todo
// ──────────────────────────────────────────────────────────────────────────────
describe('addScheduledTodoSchema', () => {
  const base = { title: 'テスト', scheduled_date: '2024-12-31' }

  it('正常系: 最小入力', () => {
    assert.ok(addScheduledTodoSchema.safeParse(base).success)
  })

  it('正常系: title が境界値ちょうど', () => {
    const r = addScheduledTodoSchema.safeParse({ ...base, title: 'a'.repeat(LIMITS.TITLE_MAX) })
    assert.ok(r.success)
  })

  it('異常系: title が上限+1 文字', () => {
    const input = 'a'.repeat(LIMITS.TITLE_MAX + 1)
    const r = addScheduledTodoSchema.safeParse({ ...base, title: input })
    assert.ok(!r.success)
    const msg = r.error!.issues[0].message
    assert.match(msg, /200/)
    assert.match(msg, new RegExp(`入力${input.length}文字`), `実測値がメッセージに含まれていない: ${msg}`)
    assert.match(msg, /再実行/)
  })

  it('異常系: title が空文字', () => {
    assert.ok(!addScheduledTodoSchema.safeParse({ ...base, title: '' }).success)
  })

  it('正常系: scheduled_date が有効', () => {
    for (const d of ['2024-01-01', '2024-12-31', '2024-02-29']) {
      assert.ok(addScheduledTodoSchema.safeParse({ ...base, scheduled_date: d }).success, `${d} は有効なはず`)
    }
  })

  it('異常系: scheduled_date が "2024/12/31"（スラッシュ区切り）', () => {
    const r = addScheduledTodoSchema.safeParse({ ...base, scheduled_date: '2024/12/31' })
    assert.ok(!r.success)
    assert.match(r.error!.issues[0].message, /再実行/)
  })

  it('異常系: scheduled_date が "20241231"（区切りなし）', () => {
    assert.ok(!addScheduledTodoSchema.safeParse({ ...base, scheduled_date: '20241231' }).success)
  })

  it('異常系: scheduled_date が "2024-13-01"（月が範囲外）', () => {
    assert.ok(!addScheduledTodoSchema.safeParse({ ...base, scheduled_date: '2024-13-01' }).success)
  })

  it('異常系: scheduled_time が "25:00"', () => {
    assert.ok(!addScheduledTodoSchema.safeParse({ ...base, scheduled_time: '25:00' }).success)
  })

  it('正常系: notification_offset_* が有効値', () => {
    const r = addScheduledTodoSchema.safeParse({
      ...base,
      notification_offset_1: 'on_time',
      notification_offset_2: '1hour_before',
    })
    assert.ok(r.success)
  })

  it('異常系: notification_offset_1 が不正値', () => {
    const r = addScheduledTodoSchema.safeParse({ ...base, notification_offset_1: '5min_before' })
    assert.ok(!r.success)
    assert.match(r.error!.issues[0].message, /再実行/)
  })

  it('正常系: location が境界値ちょうど', () => {
    const r = addScheduledTodoSchema.safeParse({ ...base, location: 'a'.repeat(LIMITS.LOCATION_MAX) })
    assert.ok(r.success)
  })

  it('異常系: location が上限+1 文字', () => {
    const input = 'a'.repeat(LIMITS.LOCATION_MAX + 1)
    const r = addScheduledTodoSchema.safeParse({ ...base, location: input })
    assert.ok(!r.success)
    const msg = r.error!.issues[0].message
    assert.match(msg, /100/)
    assert.match(msg, new RegExp(`入力${input.length}文字`), `実測値がメッセージに含まれていない: ${msg}`)
    assert.match(msg, /再実行/)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// add_persistent_todo
// ──────────────────────────────────────────────────────────────────────────────
describe('addPersistentTodoSchema', () => {
  it('正常系: 最小入力', () => {
    assert.ok(addPersistentTodoSchema.safeParse({ title: 'テスト' }).success)
  })

  it('正常系: title が境界値ちょうど', () => {
    assert.ok(addPersistentTodoSchema.safeParse({ title: 'a'.repeat(LIMITS.TITLE_MAX) }).success)
  })

  it('異常系: title が上限+1 文字', () => {
    const input = 'a'.repeat(LIMITS.TITLE_MAX + 1)
    const r = addPersistentTodoSchema.safeParse({ title: input })
    assert.ok(!r.success)
    const msg = r.error!.issues[0].message
    assert.match(msg, /200/)
    assert.match(msg, new RegExp(`入力${input.length}文字`), `実測値がメッセージに含まれていない: ${msg}`)
    assert.match(msg, /再実行/)
  })

  it('異常系: title が空文字', () => {
    assert.ok(!addPersistentTodoSchema.safeParse({ title: '' }).success)
  })

  it('異常系: title が空白のみ', () => {
    assert.ok(!addPersistentTodoSchema.safeParse({ title: '  ' }).success)
  })

  it('異常系: scheduled_time が "9:5"', () => {
    assert.ok(!addPersistentTodoSchema.safeParse({ title: 'テスト', scheduled_time: '9:5' }).success)
  })

  it('異常系: scheduled_time が "あ"', () => {
    assert.ok(!addPersistentTodoSchema.safeParse({ title: 'テスト', scheduled_time: 'あ' }).success)
  })
})

// ──────────────────────────────────────────────────────────────────────────────
// add_kpt_item
// ──────────────────────────────────────────────────────────────────────────────
describe('addKptItemSchema', () => {
  it('正常系: 有効な type と content', () => {
    for (const t of ['keep', 'problem', 'try'] as const) {
      assert.ok(addKptItemSchema.safeParse({ type: t, content: 'テスト' }).success)
    }
  })

  it('正常系: content が境界値ちょうど（KPT_CONTENT_MAX 文字）', () => {
    const r = addKptItemSchema.safeParse({ type: 'keep', content: 'a'.repeat(LIMITS.KPT_CONTENT_MAX) })
    assert.ok(r.success)
  })

  it('異常系: content が上限+1 文字', () => {
    const input = 'a'.repeat(LIMITS.KPT_CONTENT_MAX + 1)
    const r = addKptItemSchema.safeParse({ type: 'keep', content: input })
    assert.ok(!r.success)
    const msg = r.error!.issues[0].message
    assert.match(msg, /500/)
    assert.match(msg, new RegExp(`入力${input.length}文字`), `実測値がメッセージに含まれていない: ${msg}`)
    assert.match(msg, /再実行/)
  })

  it('異常系: content が空文字', () => {
    assert.ok(!addKptItemSchema.safeParse({ type: 'keep', content: '' }).success)
  })

  it('異常系: content が空白のみ', () => {
    assert.ok(!addKptItemSchema.safeParse({ type: 'keep', content: '   ' }).success)
  })

  it('異常系: type が不正値', () => {
    const r = addKptItemSchema.safeParse({ type: 'good', content: 'テスト' })
    assert.ok(!r.success)
    assert.match(r.error!.issues[0].message, /再実行/)
  })
})
