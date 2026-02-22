import { filterLogs } from './filter-logs.util'

import type { LogcatEntryMessage } from '@/types/logcat-entry-message.type'

const LOGS: LogcatEntryMessage[] = [
  {
    serial: 'TR333RG20B',
    date: 1738302809.453,
    pid: 566,
    tid: 597,
    priority: 2,
    tag: 'ANDR-PERF-MPCTL',
    message: 'Invalid profile no. 0, total profiles 0 only',
  },
  {
    serial: 'TR333RG20B',
    date: 1738302809.457,
    pid: 1679,
    tid: 3010,
    priority: 3,
    tag: 'ActivityTrigger',
    message:
      'activityResumeTrigger: The activity in ApplicationInfo{b921a7d com.android.chrome} is now in focus and seems to be in full-screen mode',
  },
  {
    serial: 'TR333RG20B',
    date: 1738302809.458,
    pid: 1679,
    tid: 3010,
    priority: 6,
    tag: 'ActivityTrigger',
    message: 'activityResumeTrigger: not whiteListedcom.android.chrome/com.google.android.apps.chrome.Main/661314621',
  },
  {
    serial: 'TR333RG20B',
    date: 1738306346.318,
    pid: 20904,
    tid: 20904,
    priority: 6,
    tag: 'ResourceType',
    message: 'Failure getting entry for 0x7f01067 (t=0 e=1660) (error -75)\n',
  },
]

describe('filterLogs util', () => {
  test('filter by priority', () => {
    expect(filterLogs(LOGS, [{ id: 'priority', value: 6 }])).toEqual([LOGS[2], LOGS[3]])
  })

  test('filter by priority verbose', () => {
    expect(filterLogs(LOGS, [{ id: 'priority', value: 2 }])).toEqual([LOGS[0], LOGS[1], LOGS[2], LOGS[3]])
  })

  test('filter by time', () => {
    expect(filterLogs(LOGS, [{ id: 'time', value: '05:53:29.457' }])).toEqual([LOGS[1]])
  })

  test('filter by pid', () => {
    expect(filterLogs(LOGS, [{ id: 'pid', value: '566' }])).toEqual([LOGS[0]])
  })

  test('filter by tid', () => {
    expect(filterLogs(LOGS, [{ id: 'tid', value: '3010' }])).toEqual([LOGS[1], LOGS[2]])
  })

  test('filter by tag', () => {
    expect(filterLogs(LOGS, [{ id: 'tag', value: 'ActivityTrigger' }])).toEqual([LOGS[1], LOGS[2]])
  })

  test('filter by message', () => {
    expect(filterLogs(LOGS, [{ id: 'text', value: 'Invalid profile no. 0, total profiles 0 only' }])).toEqual([LOGS[0]])
  })

  test('multiple filters', () => {
    expect(
      filterLogs(LOGS, [
        { id: 'priority', value: 6 },
        { id: 'tag', value: 'ResourceType' },
      ])
    ).toEqual([LOGS[3]])
  })

  test('all filters', () => {
    expect(
      filterLogs(LOGS, [
        { id: 'priority', value: 6 },
        { id: 'pid', value: '20904' },
        { id: 'tid', value: '20904' },
        { id: 'tag', value: 'ResourceType' },
        { id: 'text', value: 'Failure getting' },
      ])
    ).toEqual([LOGS[3]])
  })

  test('values should start with (case-insensitive comparison)', () => {
    expect(
      filterLogs(LOGS, [
        { id: 'priority', value: 6 },
        { id: 'pid', value: '20' },
        { id: 'tid', value: '2090' },
        { id: 'tag', value: 'resourcetype' },
        { id: 'text', value: 'Failure' },
      ])
    ).toEqual([LOGS[3]])
  })

  test('negative case', () => {
    expect(
      filterLogs(LOGS, [
        { id: 'priority', value: 3 },
        { id: 'pid', value: '22' },
        { id: 'tid', value: '20904' },
        { id: 'tag', value: 'ResourceType' },
        { id: 'text', value: 'Text' },
      ])
    ).toEqual([])
  })
})
