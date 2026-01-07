import { Shield, Zap, Users } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LandingNavbar } from '@/components/layout/LandingNavbar';
import { Hero } from '@/components/landing/Hero';

export default function Index() {
  const { currentUser } = useAuth();

  // Redirect to dashboard if already logged in
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-[#08090A] text-white flex flex-col">
      <LandingNavbar />

      {/* Hero Section */}
      <Hero />

      {/* Main Content - Features Section */}
      <main className="max-w-7xl mx-auto px-4 py-24 w-full">
        <div className="space-y-16">
          {/* Feature Trio - Colored Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
