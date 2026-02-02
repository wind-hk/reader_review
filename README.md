# Reader Reaction

类似 Grammarly Reader Reaction 的文档阅读与 AI 反馈 Demo：上传 PDF/Word，选择读者身份，获取该视角下的阅读感受与修改建议。

## 在线访问 Demo

若需生成**在线链接**供他人访问，推荐使用 [Vercel](https://vercel.com) 免费部署：

### 1. 将代码推送到 GitHub

在项目目录执行（若尚未初始化 Git）：

```bash
git init
git add .
git commit -m "Initial commit"
```

在 [GitHub](https://github.com/new) 新建仓库，然后：

```bash
git remote add origin https://github.com/你的用户名/仓库名.git
git branch -M main
git push -u origin main
```

### 2. 在 Vercel 部署

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录。
2. 点击 **Add New… → Project**，选择刚推送的仓库，**Import**。
3. **Environment Variables**：在项目设置中添加环境变量（否则文档分析与读者反馈不可用）：
   - `DEEPSEEK_API_KEY` = 你的 DeepSeek API Key（推荐）
   - 或 `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`
   - 可选：`LLM_PROVIDER` = `deepseek` | `openai` | `anthropic`
4. 点击 **Deploy**，等待构建完成。

### 3. 获取在线链接

部署成功后，Vercel 会给出一个地址，例如：

- `https://reader-rview-xxx.vercel.app`

将该链接发给他人即可访问 Demo。后续每次推送到 `main` 分支会自动重新部署。

---

## Getting Started（本地运行）

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
