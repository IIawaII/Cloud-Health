import { Link } from 'react-router-dom'
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
} from 'react-icons/fi'

const features = [
  {
    path: '/report',
    title: '健康报告分析',
    description: '上传体检报告、化验单或健康检测图像，AI 智能分析各项指标，给出专业解读和健康建议。',
    icon: FiFileText,
    color: 'from-blue-400 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    path: '/plan',
    title: '健康计划生成',
    description: '填写个人健康信息，AI 为您量身定制科学的饮食、运动和作息管理方案。',
    icon: FiClipboard,
    color: 'from-primary-400 to-primary-600',
    bgColor: 'bg-primary-50',
    textColor: 'text-primary-600',
  },
  {
    path: '/chat',
    title: '智能对话',
    description: '与健康 AI 顾问实时对话，解答您的健康疑问，获取专业的健康指导建议。',
    icon: FiMessageSquare,
    color: 'from-violet-400 to-violet-600',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    path: '/quiz',
    title: '健康问答',
    description: '通过趣味问答测试您的健康知识水平，AI 智能出题并即时判分解析。',
    icon: FiHelpCircle,
    color: 'from-amber-400 to-amber-600',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
]

const highlights = [
  { icon: FiZap, title: 'AI 智能分析', desc: '基于先进大模型技术' },
  { icon: FiShield, title: '隐私安全', desc: 'API Key 本地存储' },
  { icon: FiHeart, title: '专业可靠', desc: '科学健康知识体系' },
]

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center pt-8 pb-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-6">
          <FiActivity className="w-4 h-4" />
          智能健康诊断平台
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-5 tracking-tight">
          您的私人
          <span className="bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
            健康 AI 顾问
          </span>
        </h1>
        <p className="text-lg text-foreground-muted max-w-2xl mx-auto leading-relaxed">
          利用大语言模型技术，为您提供智能健康报告分析、个性化健康计划、
          <br className="hidden sm:block" />
          健康问答和智能对话服务，让健康管理更科学、更高效。
        </p>

        <div className="flex items-center justify-center gap-8 mt-10">
          {highlights.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white shadow-card flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.title}</span>
                <span className="text-xs text-foreground-subtle">{item.desc}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Feature Cards */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Link
                key={feature.path}
                to={feature.path}
                className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-5">
                  <div
                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0 shadow-lg`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <FiArrowRight className="w-5 h-5 text-foreground-subtle group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-sm text-foreground-muted leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Tips */}
      <section className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8 border border-primary-100">
        <div className="flex flex-col sm:flex-row items-center gap-6">
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
      </section>
    </div>
  )
}
