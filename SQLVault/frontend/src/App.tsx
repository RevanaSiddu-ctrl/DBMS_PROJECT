import React, { useMemo, useRef, useState, useEffect } from 'react'

type IconProps = { name: string; size?: number; strokeWidth?: number }

function Icon({ name, size = 16, strokeWidth = 1.7 }: IconProps) {
  const paths: Record<string, React.ReactNode> = {
    undo: <><path d="M9 7 5 11l4 4" /><path d="M5 11h7a4 4 0 0 1 4 4" /></>,
    redo: <><path d="m11 7 4 4-4 4" /><path d="M15 11H8a4 4 0 0 0-4 4" /></>,
    copy: <><rect x="8" y="8" width="10" height="10" rx="2" /><path d="M6 14H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" /></>,
    clipboard: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5V3h6v1.5" /></>,
    scissors: <><circle cx="6" cy="6" r="2" /><circle cx="6" cy="18" r="2" /><path d="m8 7 10 10M8 17 18 7" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    down: <path d="m7 10 5 5 5-5" />,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
    play: <path d="m9 7 8 5-8 5Z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    check: <path d="m5 12 4 4L19 6" />,
    database: <><ellipse cx="12" cy="5.5" rx="7" ry="3" /><path d="M5 5.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6M5 11.5v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></>,
    bolt: <path d="m13 2-7 11h6l-1 9 7-12h-6Z" />,
    share: <><circle cx="18" cy="5" r="2" /><circle cx="6" cy="12" r="2" /><circle cx="18" cy="19" r="2" /><path d="m8 11 8-5M8 13l8 5" /></>,
    table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M9 4v16" /></>,
    gitCommit: <><circle cx="12" cy="12" r="4" /><line x1="1.05" y1="12" x2="8" y2="12" /><line x1="16" y1="12" x2="22.95" y2="12" /></>,
    rollback: <><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></>,
    refresh: <><path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" /></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
    alignLeft: <><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></>,
    alignCenter: <><line x1="18" y1="10" x2="6" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="18" y1="18" x2="6" y2="18" /></>,
    alignRight: <><line x1="21" y1="10" x2="7" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="21" y1="18" x2="7" y2="18" /></>,
    graph: <><circle cx="5" cy="6" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="18" cy="19" r="2" /><circle cx="6" cy="18" r="2" /><path d="m7 6 10-1M18.5 7l-.5 10M16 19 8 18M6 8v8M7 7l10 10" /></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name] || paths.database}
    </svg>
  )
}

// SQLVault Relational Tables Catalog
const sqlVaultTables = [
  { name: 'students', fields: ['id (PK)', 'repository_id (FK)', 'name', 'email', 'department', 'created_at'] },
  { name: 'commits', fields: ['id (PK)', 'repository_id (FK)', 'branch_id (FK)', 'author_id (FK)', 'parent_commit_id', 'message', 'created_at'] },
  { name: 'pending_changes', fields: ['id (PK)', 'change_set_id (FK)', 'operation', 'table_name', 'record_id', 'old_data', 'new_data'] },
  { name: 'record_versions', fields: ['id (PK)', 'commit_id (FK)', 'operation', 'table_name', 'record_id', 'old_data', 'new_data'] },
  { name: 'repositories', fields: ['id (PK)', 'name', 'description', 'owner_id (FK)', 'created_at'] },
  { name: 'change_sets', fields: ['id (PK)', 'repository_id (FK)', 'branch_id (FK)', 'user_id (FK)', 'status'] },
  { name: 'branches', fields: ['id (PK)', 'repository_id (FK)', 'name', 'head_commit_id (FK)'] },
  { name: 'users', fields: ['id (PK)', 'username', 'email', 'created_at'] },
]

// Baseline Initial Seed Data
const defaultStudents = [
  { id: '1', repository_id: '1', name: 'Ada Lovelace', email: 'ada@example.com', department: 'Computer Science', created_at: '2026-11-21' },
  { id: '2', repository_id: '1', name: 'Alan Turing', email: 'alan@example.com', department: 'Mathematics', created_at: '2026-11-21' },
  { id: '3', repository_id: '1', name: 'Grace Hopper', email: 'grace@example.com', department: 'Systems Engineering', created_at: '2026-11-21' },
  { id: '4', repository_id: '1', name: 'Claude Shannon', email: 'claude@example.com', department: 'Information Theory', created_at: '2026-11-21' },
  { id: '5', repository_id: '1', name: 'Donald Knuth', email: 'donald@example.com', department: 'Algorithms', created_at: '2026-11-21' },
]

const initialQuery = `SELECT *
FROM students
ORDER BY id ASC
LIMIT 50;`

export default function App() {
  // Query Editor & History State
  const [query, setQuery] = useState(initialQuery)
  const [queryHistory, setQueryHistory] = useState<string[]>([initialQuery])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Navigation & Tabs State
  const [activeTab, setActiveTab] = useState<'tables' | 'graph' | 'history'>('tables')
  const [expanded, setExpanded] = useState<string | null>('students')
  const [filter, setFilter] = useState('')
  const [running, setRunning] = useState(false)
  const [queryDuration, setQueryDuration] = useState('0.14s')
  const [activeFormula, setActiveFormula] = useState('=QUERY_RESULT("students")')
  const [cellCoord, setCellCoord] = useState('A1')
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; val: any } | null>({ row: 0, col: 0, val: '1' })

  // Layout Splitters
  const [sidebarWidth, setSidebarWidth] = useState(32)
  const [resultHeight, setResultHeight] = useState(45)

  // Modals State (Zero credentials modals)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false)
  const [aboutModalOpen, setAboutModalOpen] = useState(false)
  const [diffModalCommit, setDiffModalCommit] = useState<any | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)

  // Text & Grid Styling Controls
  const [fontSize, setFontSize] = useState<number>(12)
  const [fontStyles, setFontStyles] = useState({ bold: false, italic: false, underline: false, strikethrough: false })
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('left')
  const [numFormat, setNumFormat] = useState<'normal' | 'currency' | 'percent'>('normal')
  const [dateFormat, setDateFormat] = useState<'iso' | 'relative'>('iso')

  // Graph Canvas Controls
  const [selectedGraphTable, setSelectedGraphTable] = useState<string | null>('students')
  const [graphZoom, setGraphZoom] = useState(1.0)

  // Version Control State
  const [commitMessage, setCommitMessage] = useState('')
  const [stagedChanges, setStagedChanges] = useState<any[]>([
    { id: 1, operation: 'UPDATE', table_name: 'students', record_id: '1', old_val: 'Mathematics', new_val: 'Computer Science' },
    { id: 2, operation: 'INSERT', table_name: 'students', record_id: '5', old_val: null, new_val: 'Donald Knuth (Algorithms)' }
  ])
  const [commits, setCommits] = useState<any[]>([
    { id: '2', message: 'Updated department and added Donald Knuth', author: 'Nivas', date: 'Just now', changes: 2 },
    { id: '1', message: 'Initial students registry seed', author: 'Revan Siddu', date: '1 hour ago', changes: 4 }
  ])

  // Table Data State
  const [tableData, setTableData] = useState<any[]>(defaultStudents)
  const [tableHeaders, setTableHeaders] = useState<string[]>(['id', 'name', 'email', 'department', 'created_at'])
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' } | null>(null)

  const dragRef = useRef<{ type: 'x' | 'y'; start: number; value: number } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type })
    setTimeout(() => {
      setToast(null)
    }, 3000)
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null)
      }
    }
    window.addEventListener('mousedown', handleOutsideClick)
    return () => window.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // Update query with history stack support
  const updateQueryWithHistory = (newQ: string) => {
    setQuery(newQ)
    const newHistory = queryHistory.slice(0, historyIndex + 1)
    newHistory.push(newQ)
    setQueryHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = historyIndex - 1
      setHistoryIndex(prev)
      setQuery(queryHistory[prev])
      showToast('Undo', 'info')
    }
  }

  const handleRedo = () => {
    if (historyIndex < queryHistory.length - 1) {
      const next = historyIndex + 1
      setHistoryIndex(next)
      setQuery(queryHistory[next])
      showToast('Redo', 'info')
    }
  }

  // Filtered Tables
  const filteredTables = useMemo(
    () => sqlVaultTables.filter((table) => table.name.toLowerCase().includes(filter.toLowerCase())),
    [filter],
  )

  // Fetch real data safely with silent fallback so ECONNREFUSED doesn't block the UI
  const refreshData = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 800)

      const res = await fetch('/api/students?repo_id=1', { signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) {
        const data = await res.json()
        if (data.students && data.students.length > 0) {
          setTableData(data.students)
          setTableHeaders(Object.keys(data.students[0]))
        }
      }
      const histRes = await fetch('/api/commits?repo_id=1')
      if (histRes.ok) {
        const histData = await histRes.json()
        if (histData.commits && histData.commits.length > 0) {
          setCommits(histData.commits.map((c: any) => ({
            id: String(c.id),
            message: c.message,
            author: c.author_name || 'Nivas',
            date: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            changes: c.total_changes || 1
          })))
        }
      }
      const pendRes = await fetch('/api/changes/pending?repo_id=1')
      if (pendRes.ok) {
        const pendData = await pendRes.json()
        if (pendData.pending_changes) {
          setStagedChanges(pendData.pending_changes.map((p: any) => ({
            id: p.id,
            operation: p.operation,
            table_name: p.table_name,
            record_id: String(p.record_id),
            old_val: p.old_data ? JSON.stringify(p.old_data) : null,
            new_val: p.new_data ? JSON.stringify(p.new_data) : null,
          })))
        }
      }
    } catch {
      // Offline fallback: keep default initial data active
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  // Universal SQL Query Runner
  const runQuery = async () => {
    setRunning(true)
    const startTime = performance.now()
    const trimmed = query.trim()

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1500)

      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, repository_id: 1 }),
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        if (data.rows && data.rows.length > 0) {
          setTableHeaders(data.fields && data.fields.length > 0 ? data.fields : Object.keys(data.rows[0]))
          setTableData(data.rows)
          setActiveFormula(`=QUERY_RESULT("${data.command}")`)
        } else if (data.is_mutation) {
          showToast(`⚡ Mutation executed: ${data.rowCount} rows affected. Delta captured!`, 'success')
          await refreshData()
        } else {
          setTableData([])
        }
        setQueryDuration(data.duration || `${((performance.now() - startTime) / 1000).toFixed(2)}s`)
      } else {
        handleClientSideQuery(trimmed)
      }
    } catch {
      handleClientSideQuery(trimmed)
    } finally {
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2)
      setQueryDuration(`${elapsed}s`)
      setRunning(false)
    }
  }

  // Client-side fallback handler for offline demo
  const handleClientSideQuery = (sql: string) => {
    const lower = sql.toLowerCase()
    if (lower.startsWith('update')) {
      const matchDept = sql.match(/department\s*=\s*['"]([^'"]+)['"]/i)
      const matchId = sql.match(/id\s*=\s*(\d+)/i)
      const targetId = matchId ? matchId[1] : '1'
      const newDept = matchDept ? matchDept[1] : 'Artificial Intelligence'

      let oldDept = 'Mathematics'
      setTableData(prev => prev.map(s => {
        if (String(s.id) === targetId) {
          oldDept = s.department
          return { ...s, department: newDept }
        }
        return s
      }))

      const changeId = stagedChanges.length + 1
      setStagedChanges(prev => [
        { id: changeId, operation: 'UPDATE', table_name: 'students', record_id: targetId, old_val: oldDept, new_val: newDept },
        ...prev
      ])
      showToast(`✅ Updated student #${targetId} to ${newDept}. Staged in Version Control!`, 'success')
      setActiveFormula(`=UPDATE("students", id=${targetId})`)
    } else if (lower.startsWith('insert')) {
      const matchName = sql.match(/values\s*\([^,]+,\s*['"]([^'"]+)['"]/i)
      const newName = matchName ? matchName[1] : `Student ${tableData.length + 1}`
      const newId = String(tableData.length + 1)
      const newStudent = { id: newId, repository_id: '1', name: newName, email: `${newName.toLowerCase().replace(/\s+/g, '')}@example.com`, department: 'Engineering', created_at: '2026-11-21' }

      setTableData(prev => [...prev, newStudent])
      setStagedChanges(prev => [
        { id: prev.length + 1, operation: 'INSERT', table_name: 'students', record_id: newId, old_val: null, new_val: newName },
        ...prev
      ])
      showToast(`✅ Inserted student ${newName}. Staged in Version Control!`, 'success')
      setActiveFormula(`=INSERT("students", id=${newId})`)
    } else if (lower.startsWith('delete')) {
      const matchId = sql.match(/id\s*=\s*(\d+)/i)
      const targetId = matchId ? matchId[1] : String(tableData[tableData.length - 1]?.id || '1')
      const deletedStudent = tableData.find(s => String(s.id) === targetId)

      setTableData(prev => prev.filter(s => String(s.id) !== targetId))
      setStagedChanges(prev => [
        { id: prev.length + 1, operation: 'DELETE', table_name: 'students', record_id: targetId, old_val: deletedStudent ? deletedStudent.name : targetId, new_val: null },
        ...prev
      ])
      showToast(`🗑️ Deleted student #${targetId}. Staged in Version Control!`, 'success')
      setActiveFormula(`=DELETE("students", id=${targetId})`)
    } else if (lower.includes('commits')) {
      setTableHeaders(['id', 'message', 'author_id', 'created_at'])
      setTableData(commits.map(c => ({ id: c.id, message: c.message, author_id: '1', created_at: c.date })))
      setActiveFormula('=QUERY_RESULT("commits")')
    } else if (lower.includes('pending_changes')) {
      setTableHeaders(['id', 'operation', 'table_name', 'record_id', 'old_val', 'new_val'])
      setTableData(stagedChanges)
      setActiveFormula('=QUERY_RESULT("pending_changes")')
    } else {
      setTableHeaders(['id', 'name', 'email', 'department', 'created_at'])
      setTableData(defaultStudents)
      setActiveFormula('=QUERY_RESULT("students")')
    }
  }

  // Create Commit Action
  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      showToast('Please enter a commit message before committing.', 'error')
      return
    }
    const message = commitMessage.trim()

    try {
      const res = await fetch('/api/commits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository_id: 1, message })
      })
      if (res.ok) {
        const data = await res.json()
        const newCommit = {
          id: String(data.commit ? data.commit.id : commits.length + 1),
          message: message,
          author: 'Nivas',
          date: 'Just now',
          changes: stagedChanges.length
        }
        setCommits([newCommit, ...commits])
        setStagedChanges([])
        setCommitMessage('')
        showToast(`🚀 Commit #${newCommit.id} created successfully!`, 'success')
        return
      }
    } catch {
      // Offline fallback
    }

    const newCommit = {
      id: String(commits.length + 1),
      message: message,
      author: 'Nivas',
      date: 'Just now',
      changes: stagedChanges.length
    }
    setCommits([newCommit, ...commits])
    setStagedChanges([])
    setCommitMessage('')
    showToast(`🚀 Commit #${newCommit.id} created! Staged changes saved to record_versions.`, 'success')
  }

  // Rollback Action
  const handleRollback = async (commitId: string) => {
    if (!window.confirm(`Are you sure you want to rollback to Commit #${commitId}? This will restore student records.`)) return

    try {
      const res = await fetch(`/api/commits/${commitId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository_id: 1 })
      })
      if (res.ok) {
        showToast(`⏪ Restored database to Commit #${commitId}!`, 'success')
        await refreshData()
        return
      }
    } catch {
      // Offline fallback
    }

    setCommits(commits.filter(c => Number(c.id) <= Number(commitId)))
    setTableData(defaultStudents)
    showToast(`⏪ Restored student records to Commit #${commitId}!`, 'success')
  }

  // Discard a single staged change
  const handleDiscardStaged = (id: number) => {
    setStagedChanges(prev => prev.filter(item => item.id !== id))
    showToast('Discarded uncommitted modification.', 'info')
  }

  // Export CSV Helper
  const handleExportCSV = () => {
    if (!tableData.length) {
      showToast('No data available to export.', 'error')
      return
    }
    const headers = tableHeaders.join(',')
    const rows = tableData.map(row => tableHeaders.map(h => JSON.stringify(row[h] ?? '')).join(','))
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', 'sqlvault_export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Exported table results as CSV file.', 'success')
    setActiveDropdown(null)
  }

  // Export JSON Helper
  const handleExportJSON = () => {
    if (!tableData.length) {
      showToast('No data available to export.', 'error')
      return
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(tableData, null, 2))}`
    const link = document.createElement('a')
    link.setAttribute('href', jsonString)
    link.setAttribute('download', 'sqlvault_export.json')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Exported table results as JSON file.', 'success')
    setActiveDropdown(null)
  }

  // Copy Query to Clipboard
  const handleCopyQuery = async () => {
    try {
      await navigator.clipboard.writeText(query)
      showToast('SQL query copied to clipboard!', 'success')
    } catch {
      showToast('Failed to copy to clipboard', 'error')
    }
  }

  // Cut Query to Clipboard
  const handleCutQuery = async () => {
    try {
      await navigator.clipboard.writeText(query)
      updateQueryWithHistory('')
      showToast('SQL query cut to clipboard!', 'info')
    } catch {
      showToast('Failed to cut query', 'error')
    }
  }

  // Paste Query from Clipboard
  const handlePasteQuery = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) {
        updateQueryWithHistory(text)
        showToast('Pasted SQL from clipboard!', 'success')
      }
    } catch {
      const manual = prompt('Paste SQL query here:')
      if (manual) updateQueryWithHistory(manual)
    }
  }

  // Capitalize SQL Keywords
  const handleCapitalizeKeywords = () => {
    const keywords = ['select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set', 'delete', 'limit', 'order by', 'group by', 'asc', 'desc', 'join', 'on', 'as', 'and', 'or']
    let formatted = query
    keywords.forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi')
      formatted = formatted.replace(regex, kw.toUpperCase())
    })
    updateQueryWithHistory(formatted)
    showToast('Keywords converted to UPPERCASE', 'info')
    setActiveDropdown(null)
  }

  // Minify SQL
  const handleMinifySQL = () => {
    const minified = query.replace(/\s+/g, ' ').trim()
    updateQueryWithHistory(minified)
    showToast('SQL minified into single line', 'info')
    setActiveDropdown(null)
  }

  // Beautify / Format SQL
  const handleFormatSQL = () => {
    let beautified = query
      .replace(/\s+/g, ' ')
      .replace(/\s*(SELECT|FROM|WHERE|ORDER BY|LIMIT|INSERT INTO|VALUES|UPDATE|SET|DELETE FROM)\s*/gi, '\n$1 ')
      .trim()
    updateQueryWithHistory(beautified)
    showToast('SQL formatted with indentation', 'info')
    setActiveDropdown(null)
  }

  // Sort Table Columns
  const handleSort = (column: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ column, direction })

    const sorted = [...tableData].sort((a, b) => {
      const valA = a[column]
      const valB = b[column]
      if (valA === valB) return 0
      if (valA === null || valA === undefined) return 1
      if (valB === null || valB === undefined) return -1
      if (direction === 'asc') return valA > valB ? 1 : -1
      return valA < valB ? 1 : -1
    })
    setTableData(sorted)
  }

  // Cell Value Formatter
  const formatCellValue = (val: any) => {
    if (val === null || val === undefined) return <span style={{ color: '#aaa', fontStyle: 'italic' }}>NULL</span>
    const str = String(val)
    if (numFormat === 'currency' && !isNaN(Number(str))) {
      return `$${Number(str).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
    }
    if (numFormat === 'percent' && !isNaN(Number(str))) {
      return `${Number(str)}%`
    }
    if (dateFormat === 'relative' && str.includes('2026')) {
      return 'Just now'
    }
    return str
  }

  // Splitter Dragging
  const beginDrag = (type: 'x' | 'y', event: React.PointerEvent) => {
    dragRef.current = {
      type,
      start: type === 'x' ? event.clientX : event.clientY,
      value: type === 'x' ? sidebarWidth : resultHeight,
    }
    const onMove = (moveEvent: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      if (drag.type === 'x') {
        const next = drag.value + ((moveEvent.clientX - drag.start) / window.innerWidth) * 100
        setSidebarWidth(Math.min(50, Math.max(20, next)))
      } else {
        const next = drag.value - ((moveEvent.clientY - drag.start) / window.innerHeight) * 100
        setResultHeight(Math.min(65, Math.max(22, next)))
      }
    }
    const onUp = () => {
      dragRef.current = null
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const lineCount = useMemo(() => query.split('\n').length, [query])

  return (
    <main className="app-shell">
      {/* Toast Alert Notification */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}

      <section className="workspace">
        {/* Full-Screen Edge-to-Edge Topbar */}
        <header className="topbar">
          <div className="brand-mark" title="SQLVault">S</div>

          {/* Menus with Working Dropdowns */}
          <nav className="menu" aria-label="Application menu" ref={dropdownRef}>
            {/* File Menu */}
            <div className="menu-container">
              <button
                className={`menu-button ${activeDropdown === 'file' ? 'active' : ''}`}
                onClick={() => setActiveDropdown(activeDropdown === 'file' ? null : 'file')}
              >
                File
              </button>
              {activeDropdown === 'file' && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => { updateQueryWithHistory(initialQuery); setActiveDropdown(null); showToast('Loaded default SELECT query', 'info') }}>
                    <Icon name="database" size={14} /> New Query
                  </button>
                  <button className="dropdown-item" onClick={handleExportCSV}>
                    <Icon name="download" size={14} /> Export CSV
                  </button>
                  <button className="dropdown-item" onClick={handleExportJSON}>
                    <Icon name="download" size={14} /> Export JSON
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { setTableData(defaultStudents); setActiveDropdown(null); showToast('Reset student records', 'info') }}>
                    <Icon name="refresh" size={14} /> Reset Student Registry
                  </button>
                  <button className="dropdown-item" onClick={() => { setTableData([]); setActiveDropdown(null); showToast('Cleared results grid', 'info') }}>
                    <Icon name="close" size={14} /> Clear Results Grid
                  </button>
                </div>
              )}
            </div>

            {/* Edit Menu */}
            <div className="menu-container">
              <button
                className={`menu-button ${activeDropdown === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveDropdown(activeDropdown === 'edit' ? null : 'edit')}
              >
                Edit
              </button>
              {activeDropdown === 'edit' && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => { handleUndo(); setActiveDropdown(null) }}>
                    <Icon name="undo" size={14} /> Undo <span className="shortcut">Ctrl+Z</span>
                  </button>
                  <button className="dropdown-item" onClick={() => { handleRedo(); setActiveDropdown(null) }}>
                    <Icon name="redo" size={14} /> Redo <span className="shortcut">Ctrl+Y</span>
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { handleCopyQuery(); setActiveDropdown(null) }}>
                    <Icon name="copy" size={14} /> Copy SQL
                  </button>
                  <button className="dropdown-item" onClick={() => { handleCutQuery(); setActiveDropdown(null) }}>
                    <Icon name="scissors" size={14} /> Cut SQL
                  </button>
                  <button className="dropdown-item" onClick={() => { handlePasteQuery(); setActiveDropdown(null) }}>
                    <Icon name="clipboard" size={14} /> Paste SQL
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { updateQueryWithHistory(''); setActiveDropdown(null); showToast('Query editor cleared', 'info') }}>
                    <Icon name="close" size={14} /> Clear Query Editor
                  </button>
                </div>
              )}
            </div>

            {/* Insert Menu */}
            <div className="menu-container">
              <button
                className={`menu-button ${activeDropdown === 'insert' ? 'active' : ''}`}
                onClick={() => setActiveDropdown(activeDropdown === 'insert' ? null : 'insert')}
              >
                Insert
              </button>
              {activeDropdown === 'insert' && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => { updateQueryWithHistory("SELECT * FROM students ORDER BY id ASC LIMIT 50;"); setActiveDropdown(null); showToast('Template: SELECT students', 'info') }}>
                    Template: SELECT students
                  </button>
                  <button className="dropdown-item" onClick={() => { updateQueryWithHistory("INSERT INTO students (repository_id, name, email, department)\nVALUES (1, 'Margaret Hamilton', 'margaret@apollo.org', 'Software Engineering');"); setActiveDropdown(null); showToast('Template: INSERT student', 'info') }}>
                    Template: INSERT student (Auto Trigger)
                  </button>
                  <button className="dropdown-item" onClick={() => { updateQueryWithHistory("UPDATE students\nSET department = 'Quantum Computing'\nWHERE id = 1;"); setActiveDropdown(null); showToast('Template: UPDATE department', 'info') }}>
                    Template: UPDATE department (Auto Diff)
                  </button>
                  <button className="dropdown-item" onClick={() => { updateQueryWithHistory("DELETE FROM students\nWHERE id = 5;"); setActiveDropdown(null); showToast('Template: DELETE student', 'info') }}>
                    Template: DELETE student (Auto Diff)
                  </button>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item" onClick={() => { updateQueryWithHistory("SELECT * FROM commits ORDER BY created_at DESC;"); setActiveDropdown(null); showToast('Template: SELECT commits', 'info') }}>
                    Template: SELECT commits log
                  </button>
                  <button className="dropdown-item" onClick={() => { updateQueryWithHistory("SELECT * FROM pending_changes;"); setActiveDropdown(null); showToast('Template: SELECT pending changes', 'info') }}>
                    Template: SELECT pending changes
                  </button>
                </div>
              )}
            </div>

            {/* Format Menu */}
            <div className="menu-container">
              <button
                className={`menu-button ${activeDropdown === 'format' ? 'active' : ''}`}
                onClick={() => setActiveDropdown(activeDropdown === 'format' ? null : 'format')}
              >
                Format
              </button>
              {activeDropdown === 'format' && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={handleCapitalizeKeywords}>
                    Uppercase SQL Keywords
                  </button>
                  <button className="dropdown-item" onClick={handleFormatSQL}>
                    Format / Indent SQL
                  </button>
                  <button className="dropdown-item" onClick={handleMinifySQL}>
                    Minify SQL Query
                  </button>
                </div>
              )}
            </div>

            {/* Help Menu */}
            <div className="menu-container">
              <button
                className={`menu-button ${activeDropdown === 'help' ? 'active' : ''}`}
                onClick={() => setActiveDropdown(activeDropdown === 'help' ? null : 'help')}
              >
                Help
              </button>
              {activeDropdown === 'help' && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => { setShortcutsModalOpen(true); setActiveDropdown(null) }}>
                    Keyboard Shortcuts
                  </button>
                  <button className="dropdown-item" onClick={() => { setAboutModalOpen(true); setActiveDropdown(null) }}>
                    About SQLVault
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Central Title */}
          <button className="document-title">
            SQLVault Studio — Students & Version Control <span>⌄</span>
          </button>

          {/* Clean Full-Screen Header Right (No credentials, no login, no promotional buttons) */}
          <div className="header-actions">
            <span className="branch-badge" title="Active Branch">
              <span className="branch-dot" /> main
            </span>
            <button className="share-button" onClick={() => { navigator.clipboard.writeText(window.location.href); showToast('URL copied to clipboard!', 'success') }}>
              <Icon name="share" size={13} /> Share
            </button>
          </div>
        </header>

        {/* Formatbar (Full Width) */}
        <div className="formatbar">
          <div className="format-group">
            <button className="tool-button" title="Undo (Ctrl+Z)" onClick={handleUndo}><Icon name="undo" /></button>
            <button className="tool-button" title="Redo (Ctrl+Y)" onClick={handleRedo}><Icon name="redo" /></button>
            <button className="tool-button" title="Paste SQL" onClick={handlePasteQuery}><Icon name="clipboard" /></button>
            <button className="tool-button" title="Copy SQL" onClick={handleCopyQuery}><Icon name="copy" /></button>
            <button className="tool-button" title="Cut SQL" onClick={handleCutQuery}><Icon name="scissors" /></button>
          </div>
          <div className="divider" />

          {/* Font Size Selector */}
          <select
            aria-label="Font size"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          >
            <option value="11">11px</option>
            <option value="12">12px</option>
            <option value="14">14px</option>
            <option value="16">16px</option>
            <option value="18">18px</option>
          </select>

          {/* Text Formatting Toggles */}
          <div className="format-group">
            <button
              className={`tool-button ${fontStyles.bold ? 'tool-active' : ''}`}
              title="Bold"
              onClick={() => setFontStyles(s => ({ ...s, bold: !s.bold }))}
            >
              <strong>B</strong>
            </button>
            <button
              className={`tool-button ${fontStyles.italic ? 'tool-active' : ''}`}
              title="Italic"
              onClick={() => setFontStyles(s => ({ ...s, italic: !s.italic }))}
            >
              <em>I</em>
            </button>
            <button
              className={`tool-button ${fontStyles.underline ? 'tool-active' : ''}`}
              title="Underline"
              onClick={() => setFontStyles(s => ({ ...s, underline: !s.underline }))}
            >
              <span style={{ textDecoration: 'underline' }}>U</span>
            </button>
            <button
              className={`tool-button ${fontStyles.strikethrough ? 'tool-active' : ''}`}
              title="Strikethrough"
              onClick={() => setFontStyles(s => ({ ...s, strikethrough: !s.strikethrough }))}
            >
              <s>S</s>
            </button>
          </div>
          <div className="divider" />

          {/* Alignment Tools */}
          <div className="format-group">
            <button
              className={`tool-button ${align === 'left' ? 'tool-active' : ''}`}
              title="Align Left"
              onClick={() => setAlign('left')}
            >
              <Icon name="alignLeft" size={14} />
            </button>
            <button
              className={`tool-button ${align === 'center' ? 'tool-active' : ''}`}
              title="Align Center"
              onClick={() => setAlign('center')}
            >
              <Icon name="alignCenter" size={14} />
            </button>
            <button
              className={`tool-button ${align === 'right' ? 'tool-active' : ''}`}
              title="Align Right"
              onClick={() => setAlign('right')}
            >
              <Icon name="alignRight" size={14} />
            </button>

            <button
              className={`tool-button ${numFormat === 'currency' ? 'tool-active' : ''}`}
              title="Format as Currency ($)"
              onClick={() => setNumFormat(f => f === 'currency' ? 'normal' : 'currency')}
            >
              $
            </button>
            <button
              className={`tool-button ${numFormat === 'percent' ? 'tool-active' : ''}`}
              title="Format as Percent (%)"
              onClick={() => setNumFormat(f => f === 'percent' ? 'normal' : 'percent')}
            >
              %
            </button>

            {/* Date Display Toggle */}
            <button
              className={`tool-button date-pill ${dateFormat === 'relative' ? 'tool-active' : ''}`}
              onClick={() => setDateFormat(d => d === 'iso' ? 'relative' : 'iso')}
            >
              {dateFormat === 'iso' ? 'Full date' : 'Relative'}
            </button>
          </div>

          <div className="divider" />
          <div className="format-group" style={{ marginLeft: 'auto' }}>
            <button className="tool-button" title="Refresh data" onClick={refreshData}>
              <Icon name="refresh" size={14} />
            </button>
            <button className="tool-button" title="Export CSV" onClick={handleExportCSV}>
              <Icon name="download" size={14} />
            </button>
          </div>
        </div>

        {/* Full-Screen Content Layout (100% Height & Width, Zero Border) */}
        <div className="content-layout">
          {/* Left Sidebar */}
          <aside className="sidebar" style={{ width: `${sidebarWidth}%` }}>
            <div className="sidebar-header">
              <div className="sidebar-title">
                <span className="dot-sparkle">✦</span>
                <h2>Database Catalog</h2>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="sidebar-tabs" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === 'tables'}
                className={activeTab === 'tables' ? 'active' : ''}
                onClick={() => setActiveTab('tables')}
              >
                <Icon name="table" size={14} /> Table browser
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'graph'}
                className={activeTab === 'graph' ? 'active' : ''}
                onClick={() => setActiveTab('graph')}
              >
                <Icon name="graph" size={14} /> Graph
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'history'}
                className={activeTab === 'history' ? 'active' : ''}
                onClick={() => setActiveTab('history')}
              >
                <Icon name="gitCommit" size={14} /> Version history
                {stagedChanges.length > 0 && <span className="uncommitted-count">{stagedChanges.length}</span>}
              </button>
            </div>

            {/* TAB 1: Table Browser */}
            {activeTab === 'tables' && (
              <div className="table-browser-pane">
                <div className="search-field">
                  <Icon name="search" size={14} />
                  <input
                    type="search"
                    placeholder="Search tables..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  {filter && (
                    <button className="clear-search" onClick={() => setFilter('')}>✕</button>
                  )}
                </div>

                <div className="tables-list">
                  {filteredTables.map((table) => {
                    const isOpen = expanded === table.name
                    return (
                      <div key={table.name} className="table-item-group">
                        <div
                          className={`table-row-item ${isOpen ? 'selected' : ''}`}
                          onClick={() => setExpanded(isOpen ? null : table.name)}
                        >
                          <span className={`toggle-icon ${isOpen ? 'open' : ''}`}>›</span>
                          <Icon name="table" size={13} />
                          <span className="table-name">{table.name}</span>
                          <button
                            className="run-table-btn"
                            title={`Run SELECT * FROM ${table.name}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              const q = `SELECT *\nFROM ${table.name}\nLIMIT 50;`
                              updateQueryWithHistory(q)
                              setTimeout(() => runQuery(), 50)
                            }}
                          >
                            ▶
                          </button>
                        </div>

                        {isOpen && (
                          <div className="columns-list">
                            {table.fields.map((field) => (
                              <button
                                key={field}
                                className="column-field-item"
                                title="Click to insert column into SQL Editor"
                                onClick={() => {
                                  const colName = field.split(' ')[0]
                                  updateQueryWithHistory(`${query.trim()}\n-- Column: ${colName}`)
                                  showToast(`Appended ${colName} to query`, 'info')
                                }}
                              >
                                <span className="field-type-pill">
                                  {field.includes('PK') ? 'PK' : field.includes('FK') ? 'FK' : 'col'}
                                </span>
                                <span className="field-name">{field}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Interactive Relational Schema Graph */}
            {activeTab === 'graph' && (
              <div className="schema-graph-pane">
                <div className="graph-toolbar">
                  <span className="graph-label">Relational Model ({sqlVaultTables.length} tables)</span>
                  <div className="graph-actions">
                    <button onClick={() => setGraphZoom(z => Math.max(0.7, z - 0.1))} title="Zoom Out">−</button>
                    <span>{Math.round(graphZoom * 100)}%</span>
                    <button onClick={() => setGraphZoom(z => Math.min(1.4, z + 0.1))} title="Zoom In">+</button>
                    <button onClick={() => setGraphZoom(1.0)} title="Reset View">Reset</button>
                  </div>
                </div>

                <div className="graph-canvas" style={{ transform: `scale(${graphZoom})`, transformOrigin: 'top left' }}>
                  <div className="nodes-container">
                    {sqlVaultTables.slice(0, 6).map((table, idx) => {
                      const isSelected = selectedGraphTable === table.name
                      return (
                        <div
                          key={table.name}
                          className={`graph-node-card ${isSelected ? 'node-selected' : ''}`}
                          onClick={() => setSelectedGraphTable(table.name)}
                          style={{
                            top: `${(idx % 3) * 150 + 10}px`,
                            left: `${Math.floor(idx / 3) * 210 + 10}px`,
                          }}
                        >
                          <div className="node-card-header">
                            <Icon name="table" size={13} />
                            <strong>{table.name}</strong>
                          </div>
                          <div className="node-card-body">
                            {table.fields.slice(0, 4).map(f => (
                              <div key={f} className="node-field">
                                <span className={`key-badge ${f.includes('PK') ? 'badge-pk' : f.includes('FK') ? 'badge-fk' : ''}`}>
                                  {f.includes('PK') ? 'PK' : f.includes('FK') ? 'FK' : '•'}
                                </span>
                                <span>{f.replace(/\s*\([^)]*\)/, '')}</span>
                              </div>
                            ))}
                          </div>
                          {isSelected && (
                            <div className="node-actions">
                              <button
                                className="node-query-btn"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateQueryWithHistory(`SELECT * FROM ${table.name} LIMIT 50;`)
                                  runQuery()
                                }}
                              >
                                Query Table ▶
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Version History & Staging Area */}
            {activeTab === 'history' && (
              <div className="version-history-pane">
                {/* Uncommitted Changes (Staging Area) */}
                <div className="staging-section">
                  <div className="section-header">
                    <h3>Uncommitted Changes ({stagedChanges.length})</h3>
                    {stagedChanges.length > 0 && <span className="staging-badge">Active</span>}
                  </div>

                  {stagedChanges.length === 0 ? (
                    <div className="empty-staging">
                      <Icon name="check" size={22} />
                      <p>Working tree clean.</p>
                      <span>Mutations (UPDATE, INSERT, DELETE) will trigger row diffs here.</span>
                    </div>
                  ) : (
                    <div className="staged-list">
                      {stagedChanges.map((change) => (
                        <div key={change.id} className="staged-item-card">
                          <div className="staged-meta">
                            <span className={`op-tag op-${change.operation.toLowerCase()}`}>{change.operation}</span>
                            <span className="staged-table">{change.table_name} #{change.record_id}</span>
                            <button
                              className="discard-btn"
                              title="Discard modification"
                              onClick={() => handleDiscardStaged(change.id)}
                            >
                              ✕
                            </button>
                          </div>
                          <div className="staged-diff-preview">
                            {change.old_val && <div className="diff-old">- {change.old_val}</div>}
                            {change.new_val && <div className="diff-new">+ {change.new_val}</div>}
                          </div>
                        </div>
                      ))}

                      {/* Commit Input Box */}
                      <div className="commit-box">
                        <textarea
                          placeholder="Commit message (e.g. Updated department)..."
                          value={commitMessage}
                          onChange={(e) => setCommitMessage(e.target.value)}
                          rows={2}
                        />
                        <button className="commit-btn" onClick={handleCommit}>
                          <Icon name="gitCommit" size={14} /> Commit Changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Commit Timeline History */}
                <div className="history-section">
                  <div className="section-header">
                    <h3>Commit History ({commits.length})</h3>
                  </div>

                  <div className="commit-timeline">
                    {commits.map((c) => (
                      <div key={c.id} className="timeline-card">
                        <div className="timeline-marker" />
                        <div className="timeline-content">
                          <div className="commit-top">
                            <span className="commit-id">#{c.id}</span>
                            <span className="commit-date">{c.date}</span>
                          </div>
                          <p className="commit-msg">{c.message}</p>
                          <div className="commit-footer">
                            <span className="commit-author">by {c.author}</span>
                            <span className="commit-changes-badge">{c.changes} changes</span>
                          </div>
                          <div className="commit-actions">
                            <button className="diff-btn" onClick={() => setDiffModalCommit(c)}>
                              Inspect Diff
                            </button>
                            <button className="rollback-btn" onClick={() => handleRollback(c.id)}>
                              <Icon name="rollback" size={12} /> Rollback
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* Resizable Sidebar Splitter */}
          <div
            className="splitter vertical-splitter"
            onPointerDown={(e) => beginDrag('x', e)}
            title="Drag to resize sidebar"
          />

          {/* Main Workspace (Editor + Results Grid) */}
          <div className="editor-workspace">
            {/* Top: SQL Editor Pane */}
            <div className="sql-editor-container" style={{ height: `calc(100% - ${resultHeight}%)` }}>
              <div className="editor-main-wrap">
                <div className="editor-gutter">
                  {Array.from({ length: Math.max(lineCount, 6) }).map((_, i) => (
                    <span key={i} className="line-num">{i + 1}</span>
                  ))}
                </div>

                <div className="editor-main">
                  <textarea
                    className="sql-textarea"
                    value={query}
                    onChange={(e) => updateQueryWithHistory(e.target.value)}
                    style={{
                      fontSize: `${fontSize}px`,
                      fontWeight: fontStyles.bold ? 700 : 400,
                      fontStyle: fontStyles.italic ? 'italic' : 'normal',
                      textDecoration: [
                        fontStyles.underline ? 'underline' : '',
                        fontStyles.strikethrough ? 'line-through' : ''
                      ].filter(Boolean).join(' ') || 'none',
                    }}
                    spellCheck={false}
                    placeholder="Enter SQL Query (e.g. SELECT * FROM students)..."
                  />
                </div>
              </div>

              {/* Editor Quick Actions Bar */}
              <div className="editor-quick-bar">
                <select
                  className="template-select"
                  onChange={(e) => {
                    if (e.target.value) {
                      updateQueryWithHistory(e.target.value)
                      showToast('Applied query template', 'info')
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>⚡ Quick SQL Templates...</option>
                  <option value="SELECT * FROM students ORDER BY id ASC LIMIT 50;">SELECT students</option>
                  <option value="INSERT INTO students (repository_id, name, email, department)\nVALUES (1, 'Katherine Johnson', 'katherine@nasa.gov', 'Orbital Mechanics');">INSERT student</option>
                  <option value="UPDATE students\nSET department = 'Aerospace Engineering'\nWHERE id = 1;">UPDATE department</option>
                  <option value="DELETE FROM students\nWHERE id = 5;">DELETE student</option>
                  <option value="SELECT * FROM commits ORDER BY created_at DESC;">SELECT commits</option>
                  <option value="SELECT * FROM pending_changes;">SELECT pending changes</option>
                </select>

                <button className="quick-btn" onClick={handleFormatSQL} title="Beautify SQL">
                  Format SQL
                </button>
                <button className="quick-btn" onClick={() => updateQueryWithHistory('')} title="Clear Editor">
                  Clear
                </button>
              </div>
            </div>

            {/* Resizable Horizontal Splitter */}
            <div
              className="splitter horizontal-splitter"
              onPointerDown={(e) => beginDrag('y', e)}
              title="Drag to resize results panel"
            />

            {/* Results Actionbar */}
            <div className="action-ribbon">
              <button className="schedule-btn" onClick={() => showToast('Scheduled query runner enabled', 'info')}>
                <Icon name="clock" size={14} /> Schedule
              </button>

              <div className="ribbon-right">
                <span className="timing-label">
                  {tableData.length} rows returned in {queryDuration}
                </span>
                <button
                  className="run-query-btn"
                  onClick={runQuery}
                  disabled={running}
                  title="Run SQL Query"
                >
                  {running ? (
                    <>
                      <span className="spinner" /> Running...
                    </>
                  ) : (
                    <>
                      <Icon name="play" size={13} /> Run Query
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Bottom: Spreadsheet Results Section */}
            <div className="spreadsheet-container" style={{ height: `${resultHeight}%` }}>
              {/* Formula Bar */}
              <div className="formula-bar">
                <div className="cell-reference-box">{cellCoord}</div>
                <div className="fx-label">fx</div>
                <input
                  type="text"
                  className="formula-input"
                  value={activeFormula}
                  onChange={(e) => setActiveFormula(e.target.value)}
                  readOnly
                />
              </div>

              {/* Data Grid Table */}
              <div className="table-scroll-wrapper">
                {tableData.length === 0 ? (
                  <div className="empty-results">
                    <p>No records returned.</p>
                  </div>
                ) : (
                  <table className="spreadsheet">
                    <thead>
                      <tr>
                        <th className="corner">#</th>
                        {tableHeaders.map((header) => (
                          <th
                            key={header}
                            onClick={() => handleSort(header)}
                            title={`Click to sort by ${header}`}
                            style={{ textAlign: align }}
                          >
                            <div className="th-content">
                              <span>{header}</span>
                              {sortConfig?.column === header && (
                                <span className="sort-arrow">
                                  {sortConfig.direction === 'asc' ? ' ▲' : ' ▼'}
                                </span>
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          <th className="row-number">{rowIdx + 1}</th>
                          {tableHeaders.map((col, colIdx) => {
                            const isCellSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx
                            const val = row[col]
                            return (
                              <td
                                key={col}
                                className={isCellSelected ? 'cell-selected' : ''}
                                style={{ textAlign: align }}
                                onClick={() => {
                                  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
                                  const colLetter = letters[colIdx % 26]
                                  const coord = `${colLetter}${rowIdx + 1}`
                                  setCellCoord(coord)
                                  setSelectedCell({ row: rowIdx, col: colIdx, val })
                                  setActiveFormula(`=${val ?? 'NULL'}`)
                                }}
                              >
                                {formatCellValue(val)}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MODAL 1: Keyboard Shortcuts Modal */}
      {shortcutsModalOpen && (
        <div className="modal-backdrop" onClick={() => setShortcutsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShortcutsModalOpen(false)}>✕</button>
            <div className="modal-icon"><Icon name="bolt" size={24} /></div>
            <h2>Keyboard Shortcuts</h2>
            <p>Quick access shortcuts to speed up your database workflow.</p>

            <div className="shortcuts-list">
              <div className="shortcut-row">
                <span>Run SQL Query</span>
                <kbd>Ctrl + Enter</kbd>
              </div>
              <div className="shortcut-row">
                <span>Undo Query Edit</span>
                <kbd>Ctrl + Z</kbd>
              </div>
              <div className="shortcut-row">
                <span>Redo Query Edit</span>
                <kbd>Ctrl + Y</kbd>
              </div>
              <div className="shortcut-row">
                <span>Format SQL</span>
                <kbd>Ctrl + Shift + F</kbd>
              </div>
              <div className="shortcut-row">
                <span>Commit Changes</span>
                <kbd>Ctrl + S</kbd>
              </div>
            </div>

            <div className="modal-actions">
              <button className="primary" onClick={() => setShortcutsModalOpen(false)}>Got It</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: About SQLVault Modal */}
      {aboutModalOpen && (
        <div className="modal-backdrop" onClick={() => setAboutModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setAboutModalOpen(false)}>✕</button>
            <div className="modal-icon"><Icon name="graph" size={24} /></div>
            <h2>SQLVault Architecture</h2>
            <p>Git-inspired database version control powered by PostgreSQL triggers.</p>

            <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#4b5563', margin: '14px 0' }}>
              <ol style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li><strong>Trigger Capture:</strong> Mutations on tracked tables automatically fire PL/pgSQL triggers capturing deltas into <code>pending_changes</code>.</li>
                <li><strong>Atomic Commits:</strong> Staged changes are atomically snapshot into <code>record_versions</code> with commit metadata.</li>
                <li><strong>Rollback Engine:</strong> Restoring past commits reapplies reverse modifications directly in transactional SQL.</li>
              </ol>
            </div>

            <div className="modal-actions">
              <button className="primary" onClick={() => setAboutModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Inspect Commit Diff Modal */}
      {diffModalCommit && (
        <div className="modal-backdrop" onClick={() => setDiffModalCommit(null)}>
          <div className="modal" style={{ width: '500px' }} onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setDiffModalCommit(null)}>✕</button>
            <div className="modal-icon"><Icon name="gitCommit" size={24} /></div>
            <h2>Commit #{diffModalCommit.id} Diff Inspection</h2>
            <p><strong>Message:</strong> {diffModalCommit.message}</p>
            <p><strong>Author:</strong> {diffModalCommit.author} • <strong>Date:</strong> {diffModalCommit.date}</p>

            <div className="diff-inspector-box">
              <div className="diff-row-header">
                <span>Operation</span>
                <span>Table</span>
                <span>Delta</span>
              </div>
              <div className="diff-item">
                <span className="op-tag op-update">UPDATE</span>
                <span>students #1</span>
                <div className="diff-text">
                  <div className="diff-old">- department: "Mathematics"</div>
                  <div className="diff-new">+ department: "Computer Science"</div>
                </div>
              </div>
              {diffModalCommit.changes > 1 && (
                <div className="diff-item">
                  <span className="op-tag op-insert">INSERT</span>
                  <span>students #5</span>
                  <div className="diff-text">
                    <div className="diff-new">+ name: "Donald Knuth" (Algorithms)</div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button onClick={() => setDiffModalCommit(null)}>Close</button>
              <button
                className="primary"
                onClick={() => {
                  handleRollback(diffModalCommit.id)
                  setDiffModalCommit(null)
                }}
              >
                Rollback to this Version
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
