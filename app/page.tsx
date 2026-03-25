'use client';

import { useState, useCallback, useRef } from 'react';
import Image from 'next/image';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      const apiResponse = await fetch('/api/remove', {
        method: 'POST',
        body: formData,
      });

      const result = await apiResponse.json();

      if (!apiResponse.ok) {
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
        <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-purple-100/80 backdrop-blur-sm border border-purple-200">
              <span className="text-2xl">🎨</span>
              <span className="text-sm font-medium text-purple-700">AI 智能抠图工具</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-4 gradient-text">
              Image BG Remover
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              一键移除图片背景，<span className="font-semibold text-purple-600">3 秒</span>完成抠图
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
                    拖拽图片到这里，或点击选择
                  </p>
                  <p className="text-gray-500">
                    支持 JPG, PNG, WebP · 最大 5MB
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
                    <h3 className="text-lg font-semibold text-gray-800">原图</h3>
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
                      {isProcessing ? '处理中...' : '透明背景'}
                    </h3>
                  </div>
                </div>
                <div className="image-preview aspect-square checkerboard">
                  {isProcessing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80">
                      <div className="spinner mb-4"></div>
                      <p className="text-gray-600 font-medium">正在智能抠图...</p>
                      <p className="text-gray-500 text-sm mt-1">通常需要 3-5 秒</p>
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
                      <p className="text-gray-600 font-medium">点击"移除背景"开始处理</p>
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
                  <span>移除背景</span>
                </button>
              )}

              {processedImage && (
                <>
                  <button
                    onClick={handleDownload}
                    className="btn-primary flex items-center gap-2 text-lg"
                  >
                    <span>⬇️</span>
                    <span>下载 PNG</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn-secondary flex items-center gap-2 text-lg"
                  >
                    <span>🔄</span>
                    <span>处理另一张</span>
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
                    <p className="font-semibold">处理完成！图片已准备好下载</p>
                    <p className="text-sm text-green-600 mt-1">透明背景 PNG 格式，可直接使用</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 特性说明 */}
        {!originalImage && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="feature-card">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-semibold text-xl text-gray-800 mb-2">3 秒完成</h3>
              <p className="text-gray-600 leading-relaxed">AI 智能识别，快速移除背景</p>
            </div>
            <div className="feature-card">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="font-semibold text-xl text-gray-800 mb-2">隐私保护</h3>
              <p className="text-gray-600 leading-relaxed">图片不落盘，处理完即删除</p>
            </div>
            <div className="feature-card">
              <div className="text-4xl mb-4">🆓</div>
              <h3 className="font-semibold text-xl text-gray-800 mb-2">免费使用</h3>
              <p className="text-gray-600 leading-relaxed">无需注册，完全免费</p>
            </div>
          </div>
        )}

        {/* 使用指南 */}
        {!originalImage && (
          <div className="mt-16 feature-card p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              <span>📖</span>
              使用指南
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex items-start gap-4">
                <div className="step-indicator flex-shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">上传图片</h4>
                  <p className="text-sm text-gray-600">拖拽或点击选择</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="step-indicator flex-shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">移除背景</h4>
                  <p className="text-sm text-gray-600">点击处理按钮</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="step-indicator flex-shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">查看对比</h4>
                  <p className="text-sm text-gray-600">左右分栏对比</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="step-indicator flex-shrink-0">4</div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-1">下载结果</h4>
                  <p className="text-sm text-gray-600">保存透明 PNG</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 页脚 */}
      <footer className="mt-20 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          <p>© 2026 Image BG Remover · Powered by Remove.bg</p>
        </div>
      </footer>
    </main>
  );
}
