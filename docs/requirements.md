# 系统要件定义书

## 一、 功能要件 (Functional Requirements)
1. **2D 风味矩阵交互 (Visual Matrix)：**
   - 横轴（硬度）、纵轴（粘度）的散点/网格交互，用户点击后联动展示对应大米详情。
2. **AI 献立ペアリングチャット (RAG Chat)：**
   - 用户输入自然语言（如：“明天的便当做什么米合适？”），系统通过向量检索推荐最匹配的两款大米。
3. **电商直达转化 (CTA)：**
   - 推荐结果卡片底部展示 Amazon 及故乡纳税直达按钮。

## 二、 非功能要件 (Non-Functional Requirements)
1. **性能指标：**
   - 采用流式输出（Streaming Response），确保 AI 回答首字延迟（TTFB）控制在 2 秒以内。
2. **安全与防刷机制：**
   - **Rate Limit：** 使用 Upstash Redis 限制单个 IP 的 API 调用频率（如每分钟最多 5 次）。
   - **Key 隔离：** 所有的 OpenAI API Key 与 Supabase 敏感密钥严格存放在服务端环境变量中，绝不暴露给前端。
3. **SEO 优化：**
   - 针对核心品牌米生成动态 SSR 详情页（`/[brand_name]`），捕获长尾搜索流量。
