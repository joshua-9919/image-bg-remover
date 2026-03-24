import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // 获取上传的文件
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    if (!imageFile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_FILE',
            message: '请上传图片文件',
          },
        },
        { status: 400 }
      );
    }

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(imageFile.type)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: '不支持的图片格式，请使用 JPG/PNG/WebP',
          },
        },
        { status: 400 }
      );
    }

    // 验证文件大小（5MB）
    const maxSize = 5 * 1024 * 1024;
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FILE_TOO_LARGE',
            message: '图片太大啦，请上传 5MB 以内的图片',
          },
        },
        { status: 400 }
      );
    }

    // 检查 API Key
    const apiKey = process.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      console.error('Remove.bg API Key 未配置');
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'API_ERROR',
            message: '服务配置错误，请联系管理员',
          },
        },
        { status: 500 }
      );
    }

    // 调用 Remove.bg API
    const startTime = Date.now();
    
    const removeBgFormData = new FormData();
    removeBgFormData.append('image_file', imageFile);
    removeBgFormData.append('size', 'auto');

    const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: removeBgFormData,
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.error('Remove.bg API 错误:', errorData);

      // 处理常见错误
      if (apiResponse.status === 402) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'API_QUOTA_EXCEEDED',
              message: '今日免费次数已用完，明日再来吧',
            },
          },
          { status: 402 }
        );
      }

      if (apiResponse.status === 401) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'API_ERROR',
              message: '服务暂时不可用，请稍后重试',
            },
          },
          { status: 500 }
        );
      }

      throw new Error(errorData.errors?.[0]?.title || '背景移除失败');
    }

    // 获取处理后的图片
    const processedBlob = await apiResponse.blob();
    const processedBuffer = Buffer.from(await processedBlob.arrayBuffer());
    const processedBase64 = `data:image/png;base64,${processedBuffer.toString('base64')}`;

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        imageBase64: processedBase64,
        originalSize: imageFile.size,
        processedSize: processedBlob.size,
        processingTime,
      },
    });
  } catch (error) {
    console.error('处理图片失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: error instanceof Error ? error.message : '处理失败，请稍后重试',
        },
      },
      { status: 500 }
    );
  }
}
