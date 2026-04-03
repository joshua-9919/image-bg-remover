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

    const apiKey = env.OPENBG_API_KEY;
    if (!apiKey) {
      return Response.json(
        { success: false, error: { code: "API_ERROR", message: "服务配置错误" } },
        { status: 500 }
      );
    }

    const startTime = Date.now();

    // 调用 openBGremover API
    const openBgFormData = new FormData();
    openBgFormData.append("image", imageFile);

    const apiResponse = await fetch("https://api.openbgremover.com/v1/remove", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}` },
      body: openBgFormData,
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));

      if (apiResponse.status === 402) {
        return Response.json(
          { success: false, error: { code: "API_QUOTA_EXCEEDED", message: "额度已用完，请充值或升级套餐" } },
          { status: 402 }
        );
      }

      throw new Error(errorData.message || "背景移除失败");
    }

    const result = await apiResponse.json();

    if (!result.success || !result.result_url) {
      throw new Error("API 返回异常");
    }

    // 下载处理后的图片并转 base64
    const imageResponse = await fetch(result.result_url);
    const processedBuffer = await imageResponse.arrayBuffer();
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
