'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Locale, getLocale, t } from '../lib/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

const useCases = [
  { key: 'ecommerce', icon: '🛒', en: 'Ecommerce', zh: '电商商品图', enDesc: 'Create clean product cutouts for stores, marketplace listings, and ads.', zhDesc: '快速生成干净商品图，用于店铺、平台主图和广告素材。' },
  { key: 'creators', icon: '🎬', en: 'Creators', zh: '内容创作者', enDesc: 'Make thumbnails, profile images, stickers, and social posts faster.', zhDesc: '更快制作封面图、头像、贴纸和社媒内容。' },
  { key: 'developers', icon: '⚙️', en: 'Developers', zh: '开发者/API', enDesc: 'Use API keys from the dashboard to add background removal to your workflow.', zhDesc: '在用户中心生成 API Key，把去背景能力接入自己的流程。' },
  { key: 'marketing', icon: '📣', en: 'Marketing', zh: '营销素材', enDesc: 'Prepare transparent PNG assets for campaigns, banners, and landing pages.', zhDesc: '为广告、横幅和落地页准备透明 PNG 素材。' },
];

const outputOptions = [
  { en: 'Transparent PNG', zh: '透明 PNG', enDesc: 'Download cutouts with transparent backgrounds.', zhDesc: '下载透明背景抠图结果。' },
  { en: 'White background workflow', zh: '白底图流程', enDesc: 'Place transparent results on a white canvas for marketplace images.', zhDesc: '把透明图放到白底画布，适合电商主图。' },
  { en: 'Reusable assets', zh: '可复用素材', enDesc: 'Keep clean foreground assets for future design work.', zhDesc: '保留干净主体素材，后续设计可反复使用。' },
];

const faqItems = [
  { enQ: 'Is Image BG Remover free to try?', zhQ: '可以免费试用吗？', enA: 'Yes. Guests can try 3 removals. Signed-in free users get 3 web removals per day during the trial.', zhA: '可以。游客可试用 3 次，登录免费用户在试用期内每天可处理 3 张。' },
  { enQ: 'What image formats are supported?', zhQ: '支持哪些图片格式？', enA: 'JPG, PNG, and WebP files up to 5MB are supported on the web uploader.', zhA: '网页上传支持 5MB 以内的 JPG、PNG 和 WebP。' },
  { enQ: 'Do you store my uploaded images?', zhQ: '会保存我上传的图片吗？', enA: 'Uploads are sent for background removal processing. Logged-in history stores metadata such as file name and size, not the final image file.', zhA: '图片会用于去背景处理；登录历史仅保存文件名、大小等元数据，不保存最终图片文件。' },
  { enQ: 'Can I use it in my own workflow?', zhQ: '能接入我自己的工作流吗？', enA: 'Yes. Signed-in users can generate API keys from the dashboard. API trial access is available before subscribing.', zhA: '可以。登录后可在用户中心生成 API Key；订阅前也有 API 试用额度。' },
];

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [locale, setLocale] = useState<Locale>('en');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isZh = locale === 'zh-CN' || locale === 'zh-TW';

  useEffect(() => {
    setLocale(getLocale());
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setIsLoggedIn(true);
      try { setUserName(JSON.parse(user).name); } catch {}
    }
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback((file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('不支持的图片格式，请使用 JPG/PNG/WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('图片太大啦，请上传 5MB 以内的图片');
      return;
    }

    setError(null);
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleRemoveBackground = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(originalImage);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('image', blob, fileName || 'image.png');

      const headers: Record<string, string> = {};
      const token = localStorage.getItem('auth_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const apiResponse = await fetch('/api/remove', {
        method: 'POST',
        headers,
        body: formData,
      });

      const result = await apiResponse.json();

      if (!apiResponse.ok) {
        if (result.error?.code === 'GUEST_LIMIT') {
          throw new Error('免费试用已用完，请注册登录获得更多额度');
        }
        if (result.error?.code === 'QUOTA_EXCEEDED') {
          throw new Error(result.error.message || '额度已用完');
        }
        throw new Error(result.error?.message || '处理失败');
      }

      setProcessedImage(result.data.imageBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = fileName.replace(/\.[^.]+$/, '') + '_no_bg.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
    setFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <main className="min-h-screen">
      {/* 头部 */}
      <header className="relative overflow-hidden bg-white/50 backdrop-blur-sm border-b border-gray-100">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-transparent to-pink-50/50" />
        <div className="relative max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <img src="/favicon.svg" alt="" width={32} height={32} className="h-8 w-8" />
            <span className="font-bold leading-tight text-gray-800">Image BG Remover</span>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <a href="/pricing" className="whitespace-nowrap text-sm text-gray-600 hover:text-purple-600 font-medium transition-colors">
              {t(locale, 'nav.pricing')}
            </a>
            <a href="/blog" className="whitespace-nowrap text-sm text-gray-600 hover:text-purple-600 font-medium transition-colors">
              {t(locale, 'nav.blog')}
            </a>
            <LanguageSwitcher locale={locale} onChange={setLocale} />
            {isLoggedIn ? (
              <>
                <a href="/dashboard" className="whitespace-nowrap text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors">
                  {userName || t(locale, 'nav.dashboard')}
                </a>
              </>
            ) : (
              <a href="/login" className="whitespace-nowrap text-sm bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 font-medium transition-colors sm:px-4">
                {t(locale, 'nav.login')}
              </a>
            )}
          </div>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-purple-100/80 backdrop-blur-sm border border-purple-200">
              <img src="/favicon.svg" alt="" width={24} height={24} className="h-6 w-6" />
              <span className="text-sm font-medium text-purple-700">{t(locale, 'app.tagline')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text">
              Image BG Remover
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t(locale, 'home.subtitle')}<span className="font-semibold text-purple-600">{t(locale, 'home.seconds')}</span>
            </p>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* 上传区域 */}
        {!originalImage && (
          <div className="mb-12">
            <div
              className="upload-area"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleUpload}
                className="hidden"
              />
              <div className="space-y-4">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-4xl shadow-lg">
                  📤
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-800 mb-2">
                    {t(locale, 'home.upload.title')}
                  </p>
                  <p className="text-gray-500">
                    {t(locale, 'home.upload.formats')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mb-8 error-banner">
            <div className="flex items-center justify-center gap-2 text-red-700">
              <span className="text-xl">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* 图片预览和处理 */}
        {originalImage && (
          <div className="space-y-8">
            {/* 图片展示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 原图 */}
              <div className="feature-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-sm">📷</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">{t(locale, 'home.original')}</h3>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full truncate max-w-[200px]">
                    {fileName}
                  </span>
                </div>
                <div className="image-preview aspect-square">
                  <Image
                    src={originalImage}
                    alt="Original"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* 处理后 */}
              <div className="feature-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                      <span className="text-sm">✨</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      {isProcessing ? t(locale, 'home.processing') : t(locale, 'home.result')}
                    </h3>
                  </div>
                </div>
                <div className="image-preview aspect-square checkerboard">
                  {isProcessing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80">
                      <div className="spinner mb-4"></div>
                      <p className="text-gray-600 font-medium">{t(locale, 'home.processing')}</p>
                      <p className="text-gray-500 text-sm mt-1">{t(locale, 'home.processing.time')}</p>
                    </div>
                  ) : processedImage ? (
                    <Image
                      src={processedImage}
                      alt="Processed"
                      fill
                      className="object-contain relative z-10"
                    />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60">
                      <div className="text-5xl mb-3 opacity-50">✨</div>
                      <p className="text-gray-600 font-medium">{t(locale, 'home.btn.remove')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-wrap justify-center gap-4">
              {!processedImage && !isProcessing && (
                <button
                  onClick={handleRemoveBackground}
                  className="btn-primary flex items-center gap-2 text-lg"
                >
                  <span>✨</span>
                  <span>{t(locale, 'home.btn.remove')}</span>
                </button>
              )}

              {processedImage && (
                <>
                  <button
                    onClick={handleDownload}
                    className="btn-primary flex items-center gap-2 text-lg"
                  >
                    <span>⬇️</span>
                    <span>{t(locale, 'home.btn.download')}</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn-secondary flex items-center gap-2 text-lg"
                  >
                    <span>🔄</span>
                    <span>{t(locale, 'home.btn.another')}</span>
                  </button>
                </>
              )}

              {isProcessing && (
                <button disabled className="btn-secondary opacity-50 cursor-not-allowed text-lg">
                  处理中...
                </button>
              )}
            </div>

            {/* 处理完成提示 */}
            {processedImage && (
              <div className="success-banner">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-semibold">{t(locale, 'home.done')}</p>
                    <p className="text-sm text-green-600 mt-1">{t(locale, 'home.done.desc')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 特性说明 */}
        {!originalImage && (
          <>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="feature-card">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="font-semibold text-xl text-gray-800 mb-2">{t(locale, 'home.feat.fast')}</h3>
                <p className="text-gray-600 leading-relaxed">{t(locale, 'home.feat.fast.desc')}</p>
              </div>
              <div className="feature-card">
                <div className="text-4xl mb-4">🔒</div>
                <h3 className="font-semibold text-xl text-gray-800 mb-2">{t(locale, 'home.feat.privacy')}</h3>
                <p className="text-gray-600 leading-relaxed">{t(locale, 'home.feat.privacy.desc')}</p>
              </div>
              <div className="feature-card">
                <div className="text-4xl mb-4">🆓</div>
                <h3 className="font-semibold text-xl text-gray-800 mb-2">{t(locale, 'home.feat.free')}</h3>
                <p className="text-gray-600 leading-relaxed">{t(locale, 'home.feat.free.desc')}</p>
              </div>
            </div>

            <section className="mt-16 rounded-2xl bg-white/80 p-6 md:p-8 shadow-sm border border-gray-100">
              <div className="grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">{isZh ? '自动去背景' : 'Automatic background removal'}</p>
                  <h2 className="mt-3 text-3xl font-bold text-gray-900">
                    {isZh ? '把重复修图时间省下来，专注发布和销售' : 'Save editing time and ship clean visuals faster'}
                  </h2>
                  <p className="mt-4 leading-7 text-gray-600">
                    {isZh
                      ? '参考成熟去背景工具的工作流，Image BG Remover 聚焦最常用任务：上传图片、自动去背景、下载透明 PNG，并为电商、内容创作和 API 工作流保留清晰升级路径。'
                      : 'Image BG Remover focuses on the everyday workflow: upload an image, remove the background automatically, download a transparent PNG, and scale with credits or API access when you need more.'
                    }
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="checkerboard rounded-xl p-5">
                    <div className="mx-auto flex h-44 max-w-sm items-center justify-center rounded-xl bg-white/80 shadow-inner">
                      <img src="/logo.svg" alt="Image BG Remover" className="h-16 w-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-16">
              <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">{isZh ? '适用场景' : 'Use cases'}</p>
                  <h2 className="mt-2 text-3xl font-bold text-gray-900">{isZh ? '从单张图片到批量工作流' : 'From one image to repeat workflows'}</h2>
                </div>
                <a href="/pricing" className="text-sm font-semibold text-purple-700 hover:text-purple-900">
                  {isZh ? '查看套餐与 API →' : 'View plans and API →'}
                </a>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
                {useCases.map((item) => (
                  <div key={item.key} className="feature-card">
                    <div className="text-3xl mb-4">{item.icon}</div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">{isZh ? item.zh : item.en}</h3>
                    <p className="text-sm leading-6 text-gray-600">{isZh ? item.zhDesc : item.enDesc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-16 grid gap-5 md:grid-cols-3">
              {outputOptions.map((item) => (
                <div key={item.en} className="rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm">
                  <div className="mb-4 h-20 rounded-xl checkerboard" />
                  <h3 className="text-lg font-bold text-gray-900">{isZh ? item.zh : item.en}</h3>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{isZh ? item.zhDesc : item.enDesc}</p>
                </div>
              ))}
            </section>
          </>
        )}

        {/* {t(locale, 'home.guide')} */}
        {!originalImage && (
          <div className="mt-16 feature-card p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span>📖</span>
              {t(locale, 'home.guide')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-start gap-4">
                <div className="step-indicator flex-shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">{t(locale, 'home.step1')}</h4>
                  <p className="text-sm text-gray-600">{t(locale, 'home.step1.desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="step-indicator flex-shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">{t(locale, 'home.step2')}</h4>
                  <p className="text-sm text-gray-600">{t(locale, 'home.step2.desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="step-indicator flex-shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">{t(locale, 'home.step3')}</h4>
                  <p className="text-sm text-gray-600">{t(locale, 'home.step3.desc')}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="step-indicator flex-shrink-0">4</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">{t(locale, 'home.step4')}</h4>
                  <p className="text-sm text-gray-600">{t(locale, 'home.step4.desc')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!originalImage && (
          <section className="mt-16 rounded-2xl bg-white/80 p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-purple-700">FAQ</p>
                <h2 className="mt-2 text-3xl font-bold text-gray-900">{isZh ? '常见问题' : 'Questions before you upload'}</h2>
                <p className="mt-4 leading-7 text-gray-600">
                  {isZh ? '上线前最容易影响转化的问题，直接放在首页回答。' : 'Clear answers for quota, privacy, formats, and API usage.'}
                </p>
              </div>
              <div className="space-y-4">
                {faqItems.map((item) => (
                  <details key={item.enQ} className="rounded-xl border border-gray-200 bg-white p-4">
                    <summary className="cursor-pointer font-semibold text-gray-900">{isZh ? item.zhQ : item.enQ}</summary>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{isZh ? item.zhA : item.enA}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {!originalImage && (
          <section className="mt-16 rounded-2xl bg-gray-950 p-8 text-white">
            <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <h2 className="text-3xl font-bold">{isZh ? '准备处理下一张图片？' : 'Ready to remove a background?'}</h2>
                <p className="mt-3 text-gray-300">
                  {isZh ? '先免费试用。需要更多额度时，再选择按量包、月订阅或 API。' : 'Start free. Upgrade to credits, monthly plans, or API access when you need more.'}
                </p>
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="rounded-xl bg-white px-6 py-3 font-semibold text-gray-950 hover:bg-gray-100">
                {isZh ? '上传图片' : 'Upload image'}
              </button>
            </div>
          </section>
        )}
      </div>

      {/* 页脚 */}
      <footer className="mt-20 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          <div className="mb-4 flex flex-wrap justify-center gap-4">
            <a href="/pricing" className="hover:text-purple-700">{t(locale, 'nav.pricing')}</a>
            <a href="/blog" className="hover:text-purple-700">{t(locale, 'nav.blog')}</a>
            <a href="/contact" className="hover:text-purple-700">{t(locale, 'nav.contact')}</a>
            <a href="/privacy" className="hover:text-purple-700">{t(locale, 'nav.privacy')}</a>
            <a href="/terms" className="hover:text-purple-700">{t(locale, 'nav.terms')}</a>
            <a href="/refund" className="hover:text-purple-700">{t(locale, 'nav.refund')}</a>
          </div>
          <p>{t(locale, 'home.footer')}</p>
        </div>
      </footer>
    </main>
  );
}
