import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  Camera,
  Check,
  Clock3,
  Circle,
  Flame,
  Gauge,
  HeartPulse,
  ListChecks,
  Loader2,
  LogOut,
  Mail,
  Plus,
  Search,
  Sparkles,
  Trash2,
  User,
} from 'lucide-react'
import './index.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'
const localKey = 'daily-corner-react-cache-v1'
const tokenKey = 'daily-corner-api-token-v1'

const tabs = [
  { id: 'today', label: 'Hôm nay', icon: ListChecks },
  { id: 'mood', label: 'Mood', icon: HeartPulse },
  { id: 'calendar', label: 'Lịch', icon: CalendarDays },
  { id: 'timeline', label: 'Timeline', icon: Camera },
  { id: 'stats', label: 'Thống kê', icon: Gauge },
]

const moods = [
  { label: 'Vui', tone: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { label: 'Mệt', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
  { label: 'Buồn', tone: 'bg-sky-100 text-sky-800 border-sky-200' },
  { label: 'Chill', tone: 'bg-rose-100 text-rose-800 border-rose-200' },
]

const today = toLocalISO(new Date())

const starterData = {
  tasks: [
    { id: crypto.randomUUID(), title: 'Uống nước, ăn sáng, dọn bàn 10 phút', category: 'Sức khỏe', priority: 'normal', due_date: today, done: false },
    { id: crypto.randomUUID(), title: 'Làm một việc quan trọng nhất trong ngày', category: 'Dự án', priority: 'high', due_date: today, done: false },
    { id: crypto.randomUUID(), title: 'Ghi lại mood cuối ngày', category: 'Cá nhân', priority: 'low', due_date: today, done: true },
  ],
  moods: [
    { id: crypto.randomUUID(), mood: 'Chill', caption: 'Một ngày bắt đầu gọn hơn, giữ nhịp nhẹ nhưng đều.', image: '', entry_date: today },
  ],
}

function App() {
  const [activeTab, setActiveTab] = useState('today')
  const [tasks, setTasks] = useState([])
  const [moodPosts, setMoodPosts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiOnline, setApiOnline] = useState(true)
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(tokenKey) || '')
  const [currentUser, setCurrentUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [taskDraft, setTaskDraft] = useState({ title: '', category: 'Cá nhân', priority: 'normal', due_date: today })
  const [moodDraft, setMoodDraft] = useState({ mood: 'Vui', caption: '', image: '', entry_date: today })
  const [taskFilter, setTaskFilter] = useState('open')
  const [taskSearch, setTaskSearch] = useState('')
  const fileInputRef = useRef(null)

  const apiHeaders = useCallback((extra = {}) => ({
    Accept: 'application/json',
    Authorization: `Bearer ${authToken}`,
    ...extra,
  }), [authToken])

  const handleAuthExpired = useCallback(() => {
    localStorage.removeItem(tokenKey)
    setAuthToken('')
    setCurrentUser(null)
    setTasks([])
    setMoodPosts([])
    setAuthError('Phiên đăng nhập hết hạn. Đăng nhập lại để tiếp tục.')
  }, [])

  const loadData = useCallback(async () => {
    if (!authToken) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const [userRes, taskRes, moodRes] = await Promise.all([
        fetch(`${API_BASE}/auth/me`, { headers: apiHeaders() }),
        fetch(`${API_BASE}/tasks`, { headers: apiHeaders() }),
        fetch(`${API_BASE}/moods`, { headers: apiHeaders() }),
      ])
      if (userRes.status === 401) {
        handleAuthExpired()
        return
      }
      if (!userRes.ok || !taskRes.ok || !moodRes.ok) throw new Error('API unavailable')
      const [userJson, taskJson, moodJson] = await Promise.all([userRes.json(), taskRes.json(), moodRes.json()])
      setCurrentUser(userJson.data)
      setTasks(taskJson.data)
      setMoodPosts(moodJson.data)
      persistLocal(taskJson.data, moodJson.data, authToken)
      setApiOnline(true)
    } catch {
      const cached = readLocal(authToken)
      setTasks(cached.tasks)
      setMoodPosts(cached.moods)
      setApiOnline(false)
    } finally {
      setIsLoading(false)
    }
  }, [apiHeaders, authToken, handleAuthExpired])

  useEffect(() => {
    const timer = window.setTimeout(loadData, 0)
    return () => window.clearTimeout(timer)
  }, [loadData])

  const todayTasks = useMemo(() => tasks.filter((task) => normalizeDate(task.due_date) === today), [tasks])
  const visibleTodayTasks = useMemo(() => {
    return todayTasks.filter((task) => {
      const matchesFilter = taskFilter === 'all' || (taskFilter === 'open' && !task.done) || (taskFilter === 'done' && task.done)
      const matchesSearch = task.title.toLowerCase().includes(taskSearch.trim().toLowerCase())
      return matchesFilter && matchesSearch
    })
  }, [taskFilter, taskSearch, todayTasks])
  const doneToday = todayTasks.filter((task) => task.done).length
  const progress = todayTasks.length ? Math.round((doneToday / todayTasks.length) * 100) : 0
  const latestMood = moodPosts[0]

  async function submitAuth(event) {
    event.preventDefault()
    setAuthError('')

    try {
      const payload = authMode === 'register' ? authForm : { email: authForm.email, password: authForm.password }
      const res = await fetch(`${API_BASE}/auth/${authMode}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.message || Object.values(json.errors || {})[0]?.[0] || 'Không đăng nhập được.')
      }

      localStorage.setItem(tokenKey, json.data.token)
      setAuthToken(json.data.token)
      setCurrentUser(json.data.user)
      setAuthForm({ name: '', email: '', password: '' })
      setApiOnline(true)
    } catch (error) {
      setAuthError(error.message)
    }
  }

  async function logout() {
    if (authToken) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: apiHeaders(),
        })
      } catch {
        // Logout locally even if the network is unavailable.
      }
    }

    localStorage.removeItem(tokenKey)
    setAuthToken('')
    setCurrentUser(null)
    setTasks([])
    setMoodPosts([])
  }

  async function createTask(event) {
    event.preventDefault()
    if (!taskDraft.title.trim()) return
    const optimistic = { id: crypto.randomUUID(), ...taskDraft, title: taskDraft.title.trim(), done: false }
    const next = [optimistic, ...tasks]
    setTasks(next)
    setTaskDraft((draft) => ({ ...draft, title: '' }))
    persistLocal(next, moodPosts, authToken)

    if (!apiOnline) return
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(optimistic),
      })
      const json = await res.json()
      const synced = [json.data, ...tasks]
      setTasks(synced)
      persistLocal(synced, moodPosts, authToken)
    } catch {
      setApiOnline(false)
    }
  }

  async function toggleTask(task) {
    const next = tasks.map((item) => item.id === task.id ? { ...item, done: !item.done } : item)
    setTasks(next)
    persistLocal(next, moodPosts, authToken)
    if (!apiOnline) return
    try {
      await fetch(`${API_BASE}/tasks/${task.id}`, {
        method: 'PATCH',
        headers: apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ done: !task.done }),
      })
    } catch {
      setApiOnline(false)
    }
  }

  async function deleteTask(taskId) {
    const next = tasks.filter((task) => task.id !== taskId)
    setTasks(next)
    persistLocal(next, moodPosts, authToken)
    if (!apiOnline) return
    try {
      await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE', headers: apiHeaders() })
    } catch {
      setApiOnline(false)
    }
  }

  async function createMood(event) {
    event.preventDefault()
    const optimistic = { id: crypto.randomUUID(), ...moodDraft, caption: moodDraft.caption.trim() }
    const next = [optimistic, ...moodPosts]
    setMoodPosts(next)
    setMoodDraft((draft) => ({ ...draft, caption: '', image: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
    persistLocal(tasks, next, authToken)

    if (!apiOnline) return
    try {
      const res = await fetch(`${API_BASE}/moods`, {
        method: 'POST',
        headers: apiHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(optimistic),
      })
      const json = await res.json()
      const synced = [json.data, ...moodPosts]
      setMoodPosts(synced)
      persistLocal(tasks, synced, authToken)
    } catch {
      setApiOnline(false)
    }
  }

  async function deleteMood(moodId) {
    const next = moodPosts.filter((post) => post.id !== moodId)
    setMoodPosts(next)
    persistLocal(tasks, next, authToken)
    if (!apiOnline) return
    try {
      await fetch(`${API_BASE}/moods/${moodId}`, { method: 'DELETE', headers: apiHeaders() })
    } catch {
      setApiOnline(false)
    }
  }

  function handlePhoto(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setMoodDraft((draft) => ({ ...draft, image: reader.result }))
    reader.readAsDataURL(file)
  }

  if (!authToken) {
    return (
      <AuthScreen
        authMode={authMode}
        setAuthMode={setAuthMode}
        authForm={authForm}
        setAuthForm={setAuthForm}
        authError={authError}
        submitAuth={submitAuth}
      />
    )
  }

  return (
    <main className="min-h-screen p-3 text-slate-950 sm:p-4 lg:p-6">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[224px_minmax(0,1fr)]">
        <aside className="glass sticky top-4 z-20 rounded-3xl p-3 lg:h-[calc(100vh-3rem)]">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white">
              <Sparkles size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-black">Daily Corner</p>
              <p className="truncate text-xs font-semibold text-slate-500">{currentUser?.name || 'Task & mood'}</p>
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-w-fit items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition lg:w-full ${
                    active ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/15' : 'text-slate-500 hover:bg-white/80 hover:text-slate-950'
                  }`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 rounded-2xl bg-white/75 p-4">
            <p className="text-xs font-black uppercase text-slate-400">Dữ liệu</p>
            <p className={`mt-1 text-sm font-black ${apiOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
              {apiOnline ? 'Đang lưu API' : 'Đang lưu máy'}
            </p>
            <button type="button" onClick={logout} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-xs font-black text-white">
              <LogOut size={15} /> Đăng xuất
            </button>
          </div>
        </aside>

        <section className="min-w-0">
          <Header progress={progress} isLoading={isLoading} />
          <StatusStrip doneToday={doneToday} todayTasks={todayTasks} latestMood={latestMood} moodPosts={moodPosts} />

          <section className="glass mt-4 min-h-[610px] overflow-hidden rounded-3xl">
            {activeTab === 'today' && (
              <TodayTab
                taskDraft={taskDraft}
                setTaskDraft={setTaskDraft}
                tasks={visibleTodayTasks}
                allTasks={todayTasks}
                createTask={createTask}
                toggleTask={toggleTask}
                deleteTask={deleteTask}
                taskFilter={taskFilter}
                setTaskFilter={setTaskFilter}
                taskSearch={taskSearch}
                setTaskSearch={setTaskSearch}
              />
            )}
            {activeTab === 'mood' && (
              <MoodTab
                moodDraft={moodDraft}
                setMoodDraft={setMoodDraft}
                createMood={createMood}
                handlePhoto={handlePhoto}
                fileInputRef={fileInputRef}
              />
            )}
            {activeTab === 'calendar' && <CalendarTab tasks={tasks} />}
            {activeTab === 'timeline' && <TimelineTab moodPosts={moodPosts} deleteMood={deleteMood} />}
            {activeTab === 'stats' && <StatsTab tasks={tasks} moodPosts={moodPosts} progress={progress} />}
          </section>
        </section>
      </div>
    </main>
  )
}

function AuthScreen({ authMode, setAuthMode, authForm, setAuthForm, authError, submitAuth }) {
  const isRegister = authMode === 'register'

  return (
    <main className="grid min-h-screen place-items-center p-4 text-slate-950">
      <section className="glass grid w-full max-w-5xl overflow-hidden rounded-[34px] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="bg-slate-950 p-6 text-white sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-white text-slate-950">
            <Sparkles size={24} />
          </div>
          <h1 className="mt-8 text-4xl font-black tracking-normal sm:text-5xl">Daily Corner</h1>
          <p className="mt-4 max-w-sm text-base font-semibold leading-7 text-white/65">
            Đăng nhập để task, mood và timeline chỉ thuộc về tài khoản của bạn.
          </p>
          <div className="mt-8 grid gap-3 text-sm font-bold text-white/75">
            <p className="rounded-2xl bg-white/10 p-4">Dữ liệu tách riêng theo user</p>
            <p className="rounded-2xl bg-white/10 p-4">API token bảo vệ task và mood</p>
            <p className="rounded-2xl bg-white/10 p-4">Sẵn sàng deploy public</p>
          </div>
        </div>

        <form onSubmit={submitAuth} className="p-6 sm:p-8">
          <p className="text-xs font-black uppercase text-slate-400">{isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</p>
          <h2 className="mt-2 text-3xl font-black tracking-normal text-slate-950">
            {isRegister ? 'Bắt đầu không gian riêng' : 'Quay lại không gian của bạn'}
          </h2>

          {authError && (
            <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">
              {authError}
            </div>
          )}

          <div className="mt-6 grid gap-3">
            {isRegister && (
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
                <User size={18} className="text-slate-400" />
                <input
                  className="h-12 flex-1 outline-none"
                  placeholder="Tên của bạn"
                  value={authForm.name}
                  onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })}
                  required
                />
              </label>
            )}
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
              <Mail size={18} className="text-slate-400" />
              <input
                className="h-12 flex-1 outline-none"
                placeholder="Email"
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                required
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4">
              <Sparkles size={18} className="text-slate-400" />
              <input
                className="h-12 flex-1 outline-none"
                placeholder="Mật khẩu"
                type="password"
                minLength={6}
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                required
              />
            </label>
          </div>

          <button className="mt-5 h-12 w-full rounded-2xl bg-slate-950 font-black text-white" type="submit">
            {isRegister ? 'Đăng ký' : 'Đăng nhập'}
          </button>

          <button
            className="mt-4 w-full text-sm font-black text-slate-500"
            type="button"
            onClick={() => {
              setAuthMode(isRegister ? 'login' : 'register')
              setAuthForm({ name: '', email: '', password: '' })
            }}
          >
            {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
          </button>
        </form>
      </section>
    </main>
  )
}

function Header({ progress, isLoading }) {
  return (
    <header className="glass overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-4 border-b border-white/60 p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-bold text-slate-500">{formatLongDate(today)}</p>
        <h1 className="mt-1 text-2xl font-black tracking-normal text-slate-950 sm:text-4xl">Việc rõ ràng, mood gọn một chỗ.</h1>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white/85 p-3">
        <div className="grid size-12 place-items-center rounded-xl bg-emerald-100 text-emerald-800">
          {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Flame size={24} />}
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-slate-400">Hôm nay</p>
          <p className="text-2xl font-black">{progress}%</p>
        </div>
      </div>
      </div>
      <div className="h-2 bg-white/60">
        <div className="h-full rounded-r-full bg-slate-950 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </header>
  )
}

function StatusStrip({ doneToday, todayTasks, latestMood, moodPosts }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      <CompactStat label="Việc hôm nay" value={`${doneToday}/${todayTasks.length}`} />
      <CompactStat label="Mood mới nhất" value={latestMood?.mood || '-'} />
      <CompactStat label="Nhật ký đã lưu" value={moodPosts.length} />
    </div>
  )
}

function CompactStat({ label, value }) {
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs font-black uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
    </div>
  )
}

function TodayTab({ taskDraft, setTaskDraft, tasks, allTasks, createTask, toggleTask, deleteTask, taskFilter, setTaskFilter, taskSearch, setTaskSearch }) {
  const openCount = allTasks.filter((task) => !task.done).length
  const doneCount = allTasks.filter((task) => task.done).length

  return (
    <div className="p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <PanelTitle icon={ListChecks} label="Công việc" title="Hôm nay" />
        <div className="flex flex-wrap gap-2">
          {[
            ['open', `Chưa xong ${openCount}`],
            ['done', `Đã xong ${doneCount}`],
            ['all', `Tất cả ${allTasks.length}`],
          ].map(([id, label]) => (
            <button key={id} type="button" onClick={() => setTaskFilter(id)} className={`h-10 rounded-xl px-3 text-xs font-black transition ${taskFilter === id ? 'bg-slate-950 text-white' : 'bg-white/80 text-slate-500 hover:text-slate-950'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-2">
        <Search size={18} className="text-slate-400" />
        <input className="h-9 flex-1 bg-transparent text-sm outline-none" placeholder="Tìm nhanh công việc..." value={taskSearch} onChange={(event) => setTaskSearch(event.target.value)} />
      </div>

      <form onSubmit={createTask} className="mt-3 grid gap-2 rounded-2xl bg-white/80 p-2 lg:grid-cols-[minmax(0,1fr)_118px_104px_134px_46px]">
        <input className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-slate-950" placeholder="Nhập việc cần làm..." value={taskDraft.title} onChange={(e) => setTaskDraft({ ...taskDraft, title: e.target.value })} />
        <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={taskDraft.category} onChange={(e) => setTaskDraft({ ...taskDraft, category: e.target.value })}>
          <option>Cá nhân</option>
          <option>Học tập</option>
          <option>Sức khỏe</option>
          <option>Dự án</option>
        </select>
        <select className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={taskDraft.priority} onChange={(e) => setTaskDraft({ ...taskDraft, priority: e.target.value })}>
          <option value="normal">Vừa</option>
          <option value="high">Gấp</option>
          <option value="low">Nhẹ</option>
        </select>
        <input className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm" type="date" value={taskDraft.due_date} onChange={(e) => setTaskDraft({ ...taskDraft, due_date: e.target.value })} />
        <button className="grid h-11 place-items-center rounded-xl bg-slate-950 text-white" type="submit" aria-label="Thêm task"><Plus size={19} /></button>
      </form>

      <div className="soft-scroll mt-4 grid max-h-[470px] gap-2 overflow-auto pr-1">
        {tasks.length === 0 && <EmptyState text="Không có việc nào khớp bộ lọc hiện tại." />}
        {tasks.map((task) => <TaskRow key={task.id} task={task} onToggle={() => toggleTask(task)} onDelete={() => deleteTask(task.id)} />)}
      </div>
    </div>
  )
}

function MoodTab({ moodDraft, setMoodDraft, createMood, handlePhoto, fileInputRef }) {
  return (
    <div className="grid min-h-[610px] gap-0 lg:grid-cols-[0.86fr_1.14fr]">
      <div className="photo-grid flex min-h-[280px] items-center justify-center bg-white/45 p-4">
        <button type="button" onClick={() => fileInputRef.current?.click()} className="group relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-3xl border border-white/80 bg-white shadow-xl shadow-slate-900/10">
          {moodDraft.image ? <img src={moodDraft.image} alt="Mood preview" className="h-full w-full object-cover" /> : (
            <div className="grid h-full place-items-center p-8 text-center">
              <Camera className="mx-auto text-slate-400" size={42} />
              <p className="mt-4 text-lg font-black">Chạm để chọn ảnh</p>
              <p className="mt-2 text-sm text-slate-500">Ảnh lưu dạng preview, hợp cho bản MVP.</p>
            </div>
          )}
        </button>
        <input ref={fileInputRef} hidden type="file" accept="image/*" onChange={(e) => handlePhoto(e.target.files?.[0])} />
      </div>

      <form onSubmit={createMood} className="p-4 sm:p-5">
        <PanelTitle icon={HeartPulse} label="Mood" title="Đăng cảm xúc" />
        <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
          <p className="text-xs font-black uppercase text-white/45">Lưu vào Timeline</p>
          <p className="mt-1 text-sm font-semibold text-white/80">Mỗi lần lưu là một hoạt động riêng, không ghi đè bài cũ.</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {moods.map((item) => (
            <button key={item.label} type="button" onClick={() => setMoodDraft({ ...moodDraft, mood: item.label })} className={`rounded-xl border px-4 py-3 text-sm font-black transition ${moodDraft.mood === item.label ? item.tone : 'border-slate-200 bg-white/80 text-slate-500'}`}>
              {item.label}
            </button>
          ))}
        </div>
        <textarea className="mt-4 min-h-36 w-full resize-none rounded-2xl border border-slate-200 bg-white/85 p-4 text-sm outline-none focus:border-slate-950" placeholder="Caption hôm nay..." value={moodDraft.caption} onChange={(e) => setMoodDraft({ ...moodDraft, caption: e.target.value })} />
        <input className="mt-3 h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm" type="date" value={moodDraft.entry_date} onChange={(e) => setMoodDraft({ ...moodDraft, entry_date: e.target.value })} />
        <button className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 font-black text-white" type="submit">
          <Sparkles size={18} /> Lưu mood
        </button>
      </form>
    </div>
  )
}

function CalendarTab({ tasks }) {
  const days = Array.from({ length: 30 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() + index)
    const iso = toLocalISO(date)
    return { iso, count: tasks.filter((task) => normalizeDate(task.due_date) === iso).length }
  })
  return (
    <div className="p-4 sm:p-5">
      <PanelTitle icon={CalendarDays} label="Lịch" title="30 ngày tới" />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {days.map((day) => (
          <div key={day.iso} className={`rounded-2xl border p-4 ${day.count ? 'border-emerald-200 bg-emerald-50' : 'border-white/70 bg-white/70'}`}>
            <p className="text-xs font-bold text-slate-400">{formatShortDate(day.iso)}</p>
            <p className="mt-3 text-3xl font-black">{fromISO(day.iso).getDate()}</p>
            <p className="mt-2 text-sm font-bold text-slate-500">{day.count} việc</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineTab({ moodPosts, deleteMood }) {
  const grouped = groupByDate(moodPosts)

  return (
    <div className="p-4 sm:p-5">
      <PanelTitle icon={Camera} label="Nhật ký" title="Timeline mood" />
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
        <span className="rounded-full bg-white/80 px-3 py-1">{moodPosts.length} hoạt động</span>
        <span className="rounded-full bg-white/80 px-3 py-1">Lưu tới khi bạn xóa</span>
      </div>
      <div className="mt-4 grid gap-5">
        {moodPosts.length === 0 && <EmptyState text="Chưa có mood nào để xem lại." />}
        {grouped.map((group) => (
          <section key={group.date}>
            <div className="mb-2 flex items-center gap-3">
              <p className="text-sm font-black text-slate-950">{formatTimelineDate(group.date)}</p>
              <span className="h-px flex-1 bg-white/80" />
              <span className="text-xs font-black text-slate-400">{group.items.length} bài</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.items.map((post) => <MoodCard key={post.id} post={post} deleteMood={deleteMood} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function StatsTab({ tasks, moodPosts, progress }) {
  const done = tasks.filter((task) => task.done).length
  const open = tasks.length - done
  const moodCounts = moods.map((mood) => ({
    label: mood.label,
    count: moodPosts.filter((post) => post.mood === mood.label).length,
  }))

  return (
    <div className="p-4 sm:p-5">
      <PanelTitle icon={Gauge} label="Thống kê" title="Tổng quan" />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <StatCard label="Tiến độ hôm nay" value={`${progress}%`} icon={Flame} />
        <StatCard label="Task đã xong" value={done} icon={Check} />
        <StatCard label="Mood đã lưu" value={moodPosts.length} icon={HeartPulse} />
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-2xl bg-slate-950 p-5 text-white">
          <p className="text-sm font-bold text-white/55">Task còn mở</p>
          <p className="mt-2 text-5xl font-black">{open}</p>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-emerald-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="rounded-2xl bg-white/80 p-5">
          <p className="text-sm font-black text-slate-950">Mood distribution</p>
          <div className="mt-4 grid gap-3">
            {moodCounts.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="w-14 text-sm font-bold text-slate-500">{item.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-slate-950" style={{ width: `${moodPosts.length ? (item.count / moodPosts.length) * 100 : 0}%` }} />
                </div>
                <span className="w-8 text-right text-sm font-black">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MoodCard({ post, deleteMood }) {
  return (
    <article className="group overflow-hidden rounded-[28px] border border-white/70 bg-white/82 shadow-xl shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-900/10">
      <div className="relative">
        {post.image ? <img src={post.image} alt={post.caption || post.mood} className="aspect-[4/3] w-full object-cover" /> : <div className="photo-grid grid aspect-[4/3] place-items-center text-slate-400"><Camera /></div>}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-950 shadow-sm">{post.mood}</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Clock3 size={14} /> {formatShortDate(post.entry_date)}
        </div>
        <p className="mt-3 min-h-10 text-sm font-semibold leading-6 text-slate-600">{post.caption || 'Không có caption.'}</p>
        <button type="button" onClick={() => deleteMood(post.id)} className="mt-4 flex h-9 items-center gap-2 rounded-xl bg-rose-50 px-3 text-xs font-black text-rose-600 opacity-100 transition group-hover:bg-rose-100">
          <Trash2 size={15} /> Xóa mood
        </button>
      </div>
    </article>
  )
}

function TaskRow({ task, onToggle, onDelete }) {
  const priority = {
    high: 'bg-rose-100 text-rose-700',
    normal: 'bg-slate-100 text-slate-600',
    low: 'bg-sky-100 text-sky-700',
  }[task.priority]
  return (
    <article className={`flex items-center gap-3 rounded-2xl border border-white/70 bg-white/85 p-3 shadow-sm shadow-slate-900/5 ${task.done ? 'opacity-60' : ''}`}>
      <button type="button" onClick={onToggle} className={`grid size-9 shrink-0 place-items-center rounded-xl ${task.done ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
        {task.done ? <Check size={18} /> : <Circle size={18} />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`font-black ${task.done ? 'line-through' : ''}`}>{task.title}</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-white px-3 py-1 text-slate-500">{task.category}</span>
          <span className={`rounded-full px-3 py-1 ${priority}`}>{task.priority}</span>
          <span className="rounded-full bg-white px-3 py-1 text-slate-500">{formatShortDate(task.due_date)}</span>
        </div>
      </div>
      <button type="button" onClick={onDelete} className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
        <Trash2 size={18} />
      </button>
    </article>
  )
}

function PanelTitle({ icon: Icon, label, title }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="flex items-center gap-2 text-xs font-black uppercase text-slate-400"><Icon size={15} /> {label}</p>
        <h2 className="mt-1 text-3xl font-black tracking-normal text-slate-950">{title}</h2>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-[30px] bg-white/76 p-5">
      <Icon className="text-slate-400" size={22} />
      <p className="mt-5 text-4xl font-black">{value}</p>
      <p className="mt-1 text-sm font-bold text-slate-500">{label}</p>
    </div>
  )
}

function EmptyState({ text }) {
  return <div className="rounded-3xl border border-dashed border-slate-300 bg-white/50 p-6 text-center font-bold text-slate-500">{text}</div>
}

function persistLocal(tasks, moods, token) {
  localStorage.setItem(scopedLocalKey(token), JSON.stringify({ tasks, moods }))
}

function readLocal(token) {
  const cached = localStorage.getItem(scopedLocalKey(token))
  if (!cached) return starterData
  try {
    return JSON.parse(cached)
  } catch {
    return starterData
  }
}

function scopedLocalKey(token) {
  return `${localKey}:${token ? token.slice(0, 12) : 'guest'}`
}

function toLocalISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatLongDate(dateString) {
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(fromISO(dateString))
}

function formatShortDate(dateString) {
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(fromISO(dateString))
}

function formatTimelineDate(dateString) {
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(fromISO(dateString))
}

function groupByDate(items) {
  const groups = new Map()
  items.forEach((item) => {
    const date = normalizeDate(item.entry_date)
    const group = groups.get(date) || []
    group.push(item)
    groups.set(date, group)
  })

  return Array.from(groups.entries()).map(([date, groupItems]) => ({ date, items: groupItems }))
}

function fromISO(dateString) {
  const [year, month, day] = normalizeDate(dateString).split('-').map(Number)
  return new Date(year, month - 1, day)
}

function normalizeDate(dateString) {
  return String(dateString || '').slice(0, 10)
}

export default App
