import { Shield, Zap, Users } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const { currentUser } = useAuth();

  // Redirect to dashboard if already logged in
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-5xl w-full space-y-16 text-center">
          {/* Hero Section */}
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight">
              TOOL ACCESS{' '}
              <span className="bg-slate-900 text-white px-4 inline-block">
                CHAOS TAMED
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-700 max-w-3xl mx-auto leading-relaxed">
              The internal workflow system for high-velocity marketing teams. Script, shoot, edit, approve, and publish without the mess.
            </p>

            {/* CTA Button */}
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg transition-all shadow-lg hover:shadow-xl uppercase"
              >
                Start Product →
              </Link>
            </div>

            {/* Supporting Line */}
            <p className="text-sm text-slate-600 pt-2">
              Spin up your first tool in seconds—no config needed.
            </p>
          </div>

          {/* Feature Trio - Colored Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
            {/* Feature 1 - Blue */}
            <div className="bg-blue-500 text-white p-8 rounded-lg space-y-4 text-left">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold uppercase">
                Role Based
              </h3>
              <p className="text-blue-50 leading-relaxed">
                Clear dashboards for Writers, Editors, Designers, and Ops. Focus on your work only.
              </p>
            </div>

            {/* Feature 2 - Green */}
            <div className="bg-green-500 text-white p-8 rounded-lg space-y-4 text-left">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold uppercase">
                Fast Approvals
              </h3>
              <p className="text-green-50 leading-relaxed">
                Streamlined CMO & CEO approval loops. No more lost emails or Slack messages.
              </p>
            </div>

            {/* Feature 3 - White */}
            <div className="bg-white border-4 border-slate-900 p-8 rounded-lg space-y-4 text-left">
              <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-slate-900" />
              </div>
              <h3 className="text-xl font-bold uppercase text-slate-900">
                Safe Secrets
              </h3>
              <p className="text-slate-700 leading-relaxed">
                Environment variables stay hidden from Observers. Owners/Admins manage configs with guardrails.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-sm text-slate-500">
          © 2025 Tool Hub. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
