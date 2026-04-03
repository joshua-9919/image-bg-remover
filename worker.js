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

    const apiKey = env.REMOVEBG_API_KEY;
    if (!apiKey) {
      return Response.json(
        { success: false, error: { code: "API_ERROR", message: "服务配置错误" } },
        { status: 500 }
      );
    }

    const startTime = Date.now();

    // 调用 RemoveBG API (removebgapi.com)
    const removeBgFormData = new FormData();
    removeBgFormData.append("image_file", imageFile);

    const apiResponse = await fetch("https://removebgapi.com/api/v1/remove", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}` },
      body: removeBgFormData,
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text().catch(() => "未知错误");
      console.error(`RemoveBG API error: ${apiResponse.status} - ${errorText}`);

      if (apiResponse.status === 402) {
        return Response.json(
          { success: false, error: { code: "API_QUOTA_EXCEEDED", message: "额度已用完" } },
          { status: 402 }
        );
      }

      throw new Error(`API 返回 ${apiResponse.status}: ${errorText}`);
    }

    // API 直接返回图片二进制数据
    const contentType = apiResponse.headers.get("content-type") || "";
    
    if (contentType.includes("image")) {
      // 直接返回图片
      const processedBuffer = await apiResponse.arrayBuffer();
      const bytes = new Uint8Array(processedBuffer);
      
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
    } else {
      // JSON 响应（可能包含 result_url）
      const result = await apiResponse.json();
      
      if (result.result_url) {
        const imageResponse = await fetch(result.result_url);
        const processedBuffer = await imageResponse.arrayBuffer();
        const bytes = new Uint8Array(processedBuffer);
        
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
      }
      
      throw new Error("API 返回格式异常");
    }
  } catch (error) {
    console.error("handleRemoveBg error:", error.message, error.stack);
    return Response.json(
      { success: false, error: { code: "PROCESSING_ERROR", message: error.message || "处理失败" } },
      { status: 500 }
    );
  }
}
