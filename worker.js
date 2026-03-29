export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API: 移除背景
    if (url.pathname === "/api/remove" && request.method === "POST") {
      return handleRemoveBg(request, env);
    }

    // 其他请求由 assets 处理（静态文件）
    return env.ASSETS.fetch(request);
  },
};

async function handleRemoveBg(request, env) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      return Response.json(
        { success: false, error: { code: "NO_FILE", message: "请上传图片文件" } },
        { status: 400 }
      );
    }

    const apiKey = env.REMOVE_BG_API_KEY;
    if (!apiKey) {
      return Response.json(
        { success: false, error: { code: "API_ERROR", message: "服务配置错误" } },
        { status: 500 }
      );
    }

    const startTime = Date.now();

    const removeBgFormData = new FormData();
    removeBgFormData.append("image_file", imageFile);
    removeBgFormData.append("size", "auto");

    const apiResponse = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body: removeBgFormData,
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));

      if (apiResponse.status === 402) {
        return Response.json(
          { success: false, error: { code: "API_QUOTA_EXCEEDED", message: "今日免费次数已用完，明日再来吧" } },
          { status: 402 }
        );
      }

      throw new Error(errorData.errors?.[0]?.title || "背景移除失败");
    }

    const processedBuffer = await apiResponse.arrayBuffer();
    const bytes = new Uint8Array(processedBuffer);
    
    // 高效 base64 编码
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);

    return Response.json({
      success: true,
      data: {
        imageBase64: `data:image/png;base64,${base64}`,
        processingTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: { code: "PROCESSING_ERROR", message: error.message || "处理失败" } },
      { status: 500 }
    );
  }
}
