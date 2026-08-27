import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Server, 
  Database, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  AlertTriangle,
  Cpu,
  FileCode
} from 'lucide-react';
import { SecurityAuditData } from '../types';
import { getSecurityAudit } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface SecurityAuditModalProps {
  onClose: () => void;
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [auditData, setAuditData] = useState<SecurityAuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudit = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSecurityAudit();
      setAuditData(data);
    } catch (err: any) {
      console.error('Failed to load security audit:', err);
      setError(err.message || 'Audit check failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Zero-Trust Security &amp; Trust Inspection Panel
              </h2>
              <p className="text-xs text-slate-400">
                Live cryptographic verification and server boundary diagnostics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-200 flex-1">
          
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <p className="text-xs">Querying server authorization status &amp; token claims...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <div className="font-bold mb-1">Diagnostic Error:</div>
              {error}
            </div>
          ) : auditData ? (
            <div className="space-y-6">
              
              {/* Active Verified Identity */}
              <div className="p-4 rounded-xl bg-slate-850 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Verified Authenticated Principal
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                    Token Verified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">User UID</span>
                    <span className="text-slate-200 break-all">{auditData.uid}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Identity / Email</span>
                    <span className="text-slate-200 truncate block">{auditData.email}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Token Issuer (ISS)</span>
                    <span className="text-slate-300 break-all">{auditData.tokenIssuer}</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-sans">Verification Method</span>
                    <span className="text-emerald-300">JWKS Public Key Signature</span>
                  </div>
                </div>
              </div>

              {/* Security Boundary Pillars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* 1. Firestore Security Isolation */}
                <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                    <Database className="w-4 h-4" />
                    <span>Firestore Data Isolation</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Security rules enforce <code className="text-indigo-200 bg-slate-900 px-1 py-0.5 rounded">request.auth.uid == userId</code> with root deny-by-default.
                  </p>
                  <div className="p-2 bg-slate-900 rounded-lg text-[11px] font-mono text-emerald-400 border border-slate-800 truncate">
                    {auditData.firestorePathIsolation}
                  </div>
                </div>

                {/* 2. Secret Manager & Key Quarantine */}
                <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                    <Key className="w-4 h-4" />
                    <span>Gemini Secret Quarantine</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {auditData.secretStatus?.source === 'secret_manager' 
                      ? 'Loaded via Google Cloud Secret Manager. Zero client exposure.' 
                      : 'Configured in server environment. Zero client-side exposure.'}
                  </p>
                  <div className="p-2 bg-slate-900 rounded-lg text-[11px] font-mono text-amber-300 border border-slate-800 flex items-center justify-between">
                    <span>Key Source:</span>
                    <span className="text-emerald-400 font-bold uppercase">
                      {auditData.secretStatus?.source === 'secret_manager' ? 'Secret Manager' : 'Server Environment'}
                    </span>
                  </div>
                </div>

                {/* 3. Server-Side Privilege Separation */}
                <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-purple-300 text-xs font-bold">
                    <Server className="w-4 h-4" />
                    <span>Server-Side Privilege Enclave</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Bearer-token authenticated endpoints with strict input validation, length bounds, and sanitization.
                  </p>
                  <div className="p-2 bg-slate-900 rounded-lg text-[11px] font-mono text-purple-300 border border-slate-800 flex items-center justify-between">
                    <span>CORS Policy:</span>
                    <span className="text-emerald-400 font-bold">Explicit Origin Restrict</span>
                  </div>
                </div>

                {/* 4. Attack Surface Hardening */}
                <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold">
                    <Lock className="w-4 h-4" />
                    <span>HTTP Security Hardening</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Active headers: <code className="text-slate-300">nosniff</code>, <code className="text-slate-300">SAMEORIGIN</code>, <code className="text-slate-300">strict-origin-when-cross-origin</code>, <code className="text-slate-300">Permissions-Policy</code>.
                  </p>
                </div>

              </div>

              {/* Firestore Rules Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-indigo-400" />
                    Deployed Firestore Security Rule Specification
                  </span>
                </div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isOwner(userId) {
      return request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      match /sessions/{sessionId} {
        allow read, write, delete: if isOwner(userId);
        match /messages/{messageId} {
          allow read, write, delete: if isOwner(userId);
        }
      }
      match /summaries/{summaryId} {
        allow read, write, delete: if isOwner(userId);
      }
    }
    match /{document=**} {
      allow read, write: if false; // Deny by default
    }
  }
}`}
                </pre>
              </div>

            </div>
          ) : null}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={fetchAudit}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-verify Audit</span>
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
