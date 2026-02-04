import { Link } from "wouter";
import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-slate-900 to-slate-800 text-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-2">江苏综评</h3>
            <p className="text-lg font-semibold text-blue-300 mb-4">锐鲲升学</p>
            <p className="text-sm text-gray-300">
              专业的江苏高考升学规划服务平台，为高一至高三学生提供全方位升学服务。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">快速链接</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-gray-300 hover:text-blue-300 transition">
                  首页
                </Link>
              </li>
              <li>
                <Link href="/platform/news" className="text-gray-300 hover:text-blue-300 transition">
                  升学资讯
                </Link>
              </li>
              <li>
                <Link href="/platform/projects" className="text-gray-300 hover:text-blue-300 transition">
                  研学项目
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-blue-300 transition">
                  联系我们
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">我们的服务</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>✓ 升学规划</li>
              <li>✓ 志愿填报</li>
              <li>✓ 综评申报</li>
              <li>✓ 校测辅导</li>
              <li>✓ 竞赛指导</li>
              <li>✓ 研学活动</li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-4">联系方式</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-1 text-blue-300 flex-shrink-0" />
                <div>
                  <p className="text-gray-300">13338919911</p>
                  <p className="text-gray-400 text-xs">洪老师</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-1 text-blue-300 flex-shrink-0" />
                <p className="text-gray-300">
                  淮安市淮海北路融尚广场1F
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-1 text-blue-300 flex-shrink-0" />
                <a
                  href="mailto:contact@ruikun.com"
                  className="text-gray-300 hover:text-blue-300 transition"
                >
                  联系我们
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700 pt-8">
          {/* Bottom Info */}
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
            <div>
              <p>© 2026 江苏综评 · 锐鲲升学. All rights reserved.</p>
            </div>
            <div className="mt-4 md:mt-0 flex gap-6">
              <Link href="/contact" className="hover:text-blue-300 transition">
                联系我们
              </Link>
              <a href="https://amap.com/place/B0FFKN3EKM" target="_blank" rel="noopener noreferrer" className="hover:text-blue-300 transition">
                地址导航
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
