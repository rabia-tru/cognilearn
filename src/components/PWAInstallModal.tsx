import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  X,
  Share,
  PlusSquare,
  Sparkles,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, install, isIOS } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'qr' | 'ios' | 'android'>('qr');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  const appUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (isOpen && appUrl) {
      QRCode.toDataURL(appUrl, {
        width: 240,
        margin: 1.5,
        color: {
          dark: '#1e1b4b',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch(console.error);

      // Auto-select tab based on device
      if (isIOS) {
        setActiveTab('ios');
      } else if (isInstallable) {
        setActiveTab('android');
      }
    }
  }, [isOpen, appUrl, isIOS, isInstallable]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-7 border border-slate-200 overflow-hidden text-center max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & App Title */}
        <div className="w-14 h-14 rounded-2xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto mb-2.5 shadow-md shadow-indigo-500/25">
          <Smartphone className="w-7 h-7" />
        </div>

        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
          Install CogniLearn on Your Phone
        </h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Full-screen study deck, touch swipe flashcards, and instant offline access on your home screen.
        </p>

        {/* Tab Selection */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'qr' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Scan QR</span>
          </button>
          <button
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'android' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <span>Android</span>
          </button>
          <button
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'ios' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            <span>iPhone / iPad</span>
          </button>
        </div>

        {/* TAB 1: QR CODE FOR INSTANT SCAN */}
        {activeTab === 'qr' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block mx-auto shadow-2xs">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Scan QR code to install CogniLearn"
                  className="w-48 h-48 mx-auto rounded-xl"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Generating QR code...
                </div>
              )}
            </div>

            <p className="text-xs text-slate-600 font-medium">
              Point your phone camera at this QR code to open and install the app immediately.
            </p>

            <button
              onClick={handleCopyLink}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'App Link Copied!' : 'Copy Mobile App Link'}</span>
            </button>
          </div>
        )}

        {/* TAB 2: ANDROID */}
        {activeTab === 'android' && (
          <div className="space-y-4 text-left">
            {isInstallable ? (
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    const accepted = await install();
                    if (accepted) onClose();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>1-Click Install to Home Screen</span>
                </button>
                <p className="text-center text-[11px] text-slate-400">
                  Adds CogniLearn directly to your Android launcher as a standalone app.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700">
                <p className="font-bold text-slate-900 mb-1">In Chrome on Android:</p>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    1
                  </span>
                  <span>Tap the <strong>three dots (⋮)</strong> menu in the top-right corner.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    2
                  </span>
                  <span>Tap <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                    3
                  </span>
                  <span>Tap <strong>Install</strong> to confirm.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: IPHONE / IPAD (SAFARI) */}
        {activeTab === 'ios' && (
          <div className="space-y-3 text-left bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>On iPhone / iPad (Safari):</span>
            </p>
            <div className="space-y-2.5 text-slate-700">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <span>
                  Tap the <strong className="text-slate-900">Share button</strong> (
                  <Share className="w-3.5 h-3.5 inline mx-0.5 text-indigo-600" />) at the bottom of Safari.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <span>
                  Scroll down the menu and tap <strong className="text-slate-900">&ldquo;Add to Home Screen&rdquo;</strong> (
                  <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-indigo-600" />).
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <span>Tap <strong className="text-slate-900">&ldquo;Add&rdquo;</strong> in the top-right corner.</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400">
            Works offline with local storage
          </span>
          <button
            onClick={onClose}
            className="font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
