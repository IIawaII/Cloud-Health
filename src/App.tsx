import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ResultProvider } from '@/context/ResultContext'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Layout from '@/components/Layout'
import { FiActivity } from 'react-icons/fi'

const Home = lazy(() => import('@/pages/Home'))
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const ReportAnalysis = lazy(() => import('@/pages/ReportAnalysis'))
const PlanGenerator = lazy(() => import('@/pages/PlanGenerator'))
const SmartChat = lazy(() => import('@/pages/SmartChat'))
const HealthQuiz = lazy(() => import('@/pages/HealthQuiz'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-secondary">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center animate-pulse-soft shadow-lg">
          <FiActivity className="w-5 h-5 text-white" />
        </div>
        <div className="space-y-1.5 text-center">
          <p className="text-sm font-medium text-foreground">正在进入</p>
          <p className="text-xs text-foreground-subtle">请稍候...</p>
        </div>
      </div>
    </div>
  )
}

// 已登录用户访问登录/注册页面的重定向组件
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return <>{children}</>
}

// 根路由：已登录用户重定向到 /home，未登录用户显示落地页
function LandingRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />
  }

  return <LandingPage />
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
    <Routes>
      {/* 根路由 - 落地页（未登录）或重定向到 /home（已登录） */}
      <Route path="/" element={<LandingRoute />} />

      {/* 公开路由 - 登录/注册 */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* 受保护路由 - 需要登录 */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <Layout>
              <ReportAnalysis />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/plan"
        element={
          <ProtectedRoute>
            <Layout>
              <PlanGenerator />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Layout>
              <SmartChat />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quiz"
        element={
          <ProtectedRoute>
            <Layout>
              <HealthQuiz />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 默认重定向 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  )
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ResultProvider>
          <AppRoutes />
        </ResultProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App
