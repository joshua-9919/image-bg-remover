// Cloudflare Pages Function: /api/remove
export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return Response.json(
        { success: false, error: { code: 'NO_FILE', message: '请上传图片文件' } },
        { status: 400 }
      );
    }

    const apiKey = context.env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return Response.json(
        { success: false, error: { code: 'API_ERROR', message: '服务配置错误' } },
        { status: 500 }
      );
    }

    const startTime = Date.now();

    const removeBgFormData = new FormData();
    removeBgFormData.append('image_file', imageFile);
    removeBgFormData.append('size', 'auto');

    const apiResponse = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: removeBgFormData,
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));

      if (apiResponse.status === 402) {
        return Response.json(
          { success: false, error: { code: 'API_QUOTA_EXCEEDED', message: '今日免费次数已用完，明日再来吧' } },
          { status: 402 }
        );
      }

      throw new Error(errorData.errors?.[0]?.title || '背景移除失败');
    }

    const processedBlob = await apiResponse.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(processedBlob)));
    const processedBase64 = `data:image/png;base64,${base64}`;

    return Response.json({
      success: true,
      data: {
        imageBase64: processedBase64,
        processingTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: { code: 'PROCESSING_ERROR', message: error.message || '处理失败，请稍后重试' } },
      { status: 500 }
    );
  }
}
