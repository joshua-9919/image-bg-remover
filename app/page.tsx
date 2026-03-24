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
    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('不支持的图片格式，请使用 JPG/PNG/WebP');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      setError('图片太大啦，请上传 5MB 以内的图片');
      return;
    }

    setError(null);
    setFileName(file.name);
    
    // 显示原图预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string);
      setProcessedImage(null);
    };
    reader.readAsDataURL(file);
  }, []);

  // 处理上传
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  // 处理拖拽
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

  // 调用 API 移除背景
  const handleRemoveBackground = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      // 将 Base64 转为 Blob
      const response = await fetch(originalImage);
      const blob = await response.blob();
      
      // 创建 FormData
      const formData = new FormData();
      formData.append('image', blob, fileName || 'image.png');

      // 调用 API
      const apiResponse = await fetch('/api/remove', {
        method: 'POST',
        body: formData,
      });

      const result = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(result.error?.message || '处理失败');
      }

      // 显示处理后的图片
      setProcessedImage(result.data.imageBase64);
    } catch (err) {
      setError(err instanceof Error ? err.message : '处理失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  // 下载处理后的图片
  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = fileName.replace(/\.[^.]+$/, '') + '_no_bg.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 重置
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
    <main className="min-h-screen p-4 md:p-8">
      {/* 头部 */}
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🎨 Image BG Remover
        </h1>
        <p className="text-center text-gray-600">
          一键移除图片背景 · 免费 · 无需注册
        </p>
      </header>

      {/* 主要内容 */}
      <div className="max-w-6xl mx-auto">
        {/* 上传区域 */}
        {!originalImage && (
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
            <div className="text-6xl mb-4">📤</div>
            <p className="text-xl text-gray-700 font-medium mb-2">
              拖拽图片到这里，或点击选择
            </p>
            <p className="text-gray-500">
              支持 JPG, PNG, WebP · 最大 5MB
            </p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
            ⚠️ {error}
          </div>
        )}

        {/* 图片预览和处理 */}
        {originalImage && (
          <div className="space-y-6">
            {/* 图片展示 - 左右分栏 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 原图 */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-700">原图</h3>
                  <span className="text-sm text-gray-500">{fileName}</span>
                </div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={originalImage}
                    alt="Original"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* 处理后 */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {isProcessing ? '处理中...' : '处理后（透明背景）'}
                  </h3>
                </div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  {isProcessing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="spinner mb-4"></div>
                      <p className="text-gray-600 font-medium">正在智能抠图...</p>
                      <p className="text-gray-500 text-sm mt-2">通常需要 3-5 秒</p>
                    </div>
                  ) : processedImage ? (
                    <>
                      {/* 棋盘格背景表示透明 */}
                      <div 
                        className="absolute inset-0"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e5e5e5' fill-rule='evenodd'%3E%3Cpath d='M0 0h10v10H0V0zm10 10h10v10H10V10z'/%3E%3C/g%3E%3C/svg%3E")`,
                        }}
                      />
                      <Image
                        src={processedImage}
                        alt="Processed"
                        fill
                        className="object-contain relative z-10"
                      />
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-4xl mb-2">✨</div>
                        <p>点击"移除背景"开始处理</p>
                      </div>
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
                  className="btn-primary flex items-center gap-2"
                >
                  <span>✨ 移除背景</span>
                </button>
              )}

              {processedImage && (
                <>
                  <button
                    onClick={handleDownload}
                    className="btn-primary flex items-center gap-2"
                  >
                    <span>⬇️ 下载 PNG</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <span>🔄 处理另一张</span>
                  </button>
                </>
              )}

              {isProcessing && (
                <button disabled className="btn-secondary opacity-50 cursor-not-allowed">
                  处理中...
                </button>
              )}
            </div>

            {/* 处理完成提示 */}
            {processedImage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-green-700 font-medium">✅ 处理完成！图片已准备好下载</p>
                <p className="text-green-600 text-sm mt-1">透明背景 PNG 格式，可直接使用</p>
              </div>
            )}
          </div>
        )}

        {/* 特性说明 */}
        {!originalImage && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-semibold text-lg mb-2">3 秒完成</h3>
              <p className="text-gray-600">AI 智能识别，快速移除背景</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-semibold text-lg mb-2">隐私保护</h3>
              <p className="text-gray-600">图片不落盘，处理完即删除</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="text-4xl mb-3">🆓</div>
              <h3 className="font-semibold text-lg mb-2">免费使用</h3>
              <p className="text-gray-600">无需注册，完全免费</p>
            </div>
          </div>
        )}

        {/* 使用指南 */}
        {!originalImage && (
          <div className="mt-12 bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">📖 使用指南</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                <div>
                  <h4 className="font-semibold text-gray-700">上传图片</h4>
                  <p className="text-sm text-gray-500">拖拽或点击选择</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                <div>
                  <h4 className="font-semibold text-gray-700">移除背景</h4>
                  <p className="text-sm text-gray-500">点击处理按钮</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                <div>
                  <h4 className="font-semibold text-gray-700">查看对比</h4>
                  <p className="text-sm text-gray-500">左右分栏对比</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                <div>
                  <h4 className="font-semibold text-gray-700">下载结果</h4>
                  <p className="text-sm text-gray-500">保存透明 PNG</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 页脚 */}
      <footer className="max-w-6xl mx-auto mt-16 text-center text-gray-500 text-sm">
        <p>© 2026 Image BG Remover · Powered by Remove.bg</p>
      </footer>
    </main>
  );
}
