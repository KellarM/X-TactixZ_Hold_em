import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import PostFlopCertificationAudit from '@/components/calibration/PostFlopCertificationAudit';

export default function PostFlopCertification() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white p-4 pb-16">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="text-blue-400 hover:text-blue-300 text-sm mb-3 inline-block">← Back to Game</Link>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">Post-Flop Possibilities</h1>
          </div>
          <p className="text-gray-400 text-sm">
            Certification audit and probability matrix for all {new Intl.NumberFormat().format(4960)} Post-Flop combinations.
            Run Monte Carlo simulations against true odds, compare observed vs theoretical RTP, and download the full Excel reference document.
          </p>
        </div>

        {/* Main content */}
        <PostFlopCertificationAudit />
      </div>
    </div>
  );
}
