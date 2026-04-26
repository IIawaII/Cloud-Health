import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FiFileText,
  FiClipboard,
  FiMessageSquare,
  FiHelpCircle,
  FiArrowRight,
  FiActivity,
  FiShield,
  FiZap,
  FiHeart,
  FiCheckCircle,
  FiLock,
} from 'react-icons/fi'

const features = [
  {
    title: '健康报告分析',
    description: '上传体检报告、化验单或健康检测图像，AI 智能分析各项指标，给出专业解读和健康建议。',
    icon: FiFileText,
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: '健康计划生成',
    description: '填写个人健康信息，AI 为您量身定制科学的饮食、运动和作息管理方案。',
    icon: FiClipboard,
    color: 'from-primary-400 to-primary-600',
    bgColor: 'bg-primary-50',
  },
  {
    title: '智能对话',
    description: '与健康 AI 顾问实时对话，解答您的健康疑问，获取专业的健康指导建议。',
    icon: FiMessageSquare,
    color: 'from-violet-400 to-violet-600',
    bgColor: 'bg-violet-50',
  },
  {
    title: '健康问答',
    description: '通过趣味问答测试您的健康知识水平，AI 智能出题并即时判分解析。',
    icon: FiHelpCircle,
    color: 'from-amber-400 to-amber-600',
    bgColor: 'bg-amber-50',
  },
]

const highlights = [
  { icon: FiZap, title: 'AI 智能分析', desc: '基于先进大模型技术，深度解读健康数据' },
  { icon: FiLock, title: '隐私安全', desc: 'API Key 本地存储，数据不上传云端' },
  { icon: FiHeart, title: '专业可靠', desc: '科学健康知识体系，结果有据可依' },
]

const advantages = [
  '支持多种健康报告格式上传',
  '个性化健康计划一键生成',
  '7×24 小时 AI 健康顾问在线',
  '趣味健康知识问答挑战',
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  void t

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <FiActivity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-foreground tracking-tight">
                Health Project
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-gray-100 transition-all"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary-700 transition-all shadow-sm"
              >
                免费注册
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-6 animate-fade-in">
            <FiActivity className="w-4 h-4" />
            智能健康诊断平台
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight animate-fade-in">
            您的私人
            <span className="bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
              健康 AI 顾问
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-foreground-muted max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-in">
            利用大语言模型技术，为您提供智能健康报告分析、个性化健康计划、
            健康问答和智能对话服务，让健康管理更科学、更高效。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium text-base hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg hover:shadow-xl"
            >
              免费开始使用
              <FiArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('features')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-foreground font-medium text-base border border-gray-200 hover:bg-gray-50 transition-all shadow-sm"
            >
              了解更多
            </button>
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {highlights.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card text-center hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-foreground-muted">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-foreground mb-4">核心功能</h2>
            <p className="text-foreground-muted max-w-xl mx-auto">
              四大 AI 健康服务，全方位守护您的健康生活
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="group relative bg-background-secondary rounded-2xl p-6 border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start gap-5">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                    >
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-foreground-muted leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Advantages + CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl p-8 sm:p-12 text-white shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">立即开启智能健康管理</h2>
                <p className="text-primary-100 mb-8 leading-relaxed">
                  注册账号，体验 AI 驱动的健康分析服务。无需复杂配置，几步即可开始使用。
                </p>
                <div className="space-y-3">
                  {advantages.map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <FiCheckCircle className="w-5 h-5 text-primary-200 flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="px-10 py-3.5 rounded-xl bg-white text-primary-600 font-semibold text-base hover:bg-primary-50 transition-all shadow-lg"
                >
                  免费注册
                </button>
                <p className="text-xs text-primary-200">
                  已有账号？{' '}
                  <Link to="/login" className="underline hover:text-white transition-colors">
                    立即登录
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Notice */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center gap-6 bg-primary-50 rounded-2xl p-8 border border-primary-100">
            <div className="w-16 h-16 rounded-2xl bg-white shadow-card flex items-center justify-center flex-shrink-0">
              <FiShield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">安全提示</h3>
              <p className="text-sm text-foreground-muted leading-relaxed">
                本工具基于人工智能技术分析健康信息，结果仅供参考，不能替代专业医生的诊断和治疗建议。
                如有严重健康问题，请及时就医。您的 API 密钥仅保存在本地浏览器中，我们不会收集或存储您的任何健康数据。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-foreground-subtle">
          <p>Health Project - 智能健康诊断平台 | 本工具仅供参考，不能替代专业医疗建议</p>
        </div>
      </footer>
    </div>
  )
}
