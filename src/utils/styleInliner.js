import hljs from "highlight.js";

// ==================== 代码高亮内联样式映射 ====================
// 基于 highlight.js 的 github 主题，将 class 映射为内联 style
const HLJS_INLINE_MAP = {
    "hljs-keyword": "color:#d73a49;font-weight:bold;",
    "hljs-string": "color:#032f62;",
    "hljs-comment": "color:#6a737d;font-style:italic;",
    "hljs-number": "color:#005cc5;",
    "hljs-literal": "color:#005cc5;",
    "hljs-type": "color:#005cc5;",
    "hljs-built_in": "color:#6f42c1;",
    "hljs-function": "color:#6f42c1;",
    "hljs-title": "color:#6f42c1;font-weight:bold;",
    "hljs-params": "color:#24292e;",
    "hljs-meta": "color:#e36209;",
    "hljs-attr": "color:#005cc5;",
    "hljs-variable": "color:#e36209;",
    "hljs-selector-class": "color:#6f42c1;",
    "hljs-selector-tag": "color:#22863a;",
    "hljs-name": "color:#22863a;",
    "hljs-attribute": "color:#6f42c1;",
    "hljs-section": "color:#005cc5;font-weight:bold;",
    "hljs-tag": "color:#22863a;",
    "hljs-addition": "color:#22863a;background:#f0fff4;",
    "hljs-deletion": "color:#b31d28;background:#ffeef0;",
    "hljs-emphasis": "font-style:italic;",
    "hljs-strong": "font-weight:bold;",
    "hljs-punctuation": "color:#24292e;",
    "hljs-operator": "color:#d73a49;",
    "hljs-regexp": "color:#032f62;",
    "hljs-symbol": "color:#005cc5;",
    "hljs-bullet": "color:#005cc5;",
    "hljs-link": "color:#032f62;text-decoration:underline;",
    "hljs-doctag": "color:#d73a49;font-weight:bold;",
    "hljs-formula": "color:#24292e;",
};

// ==================== 微信兼容的标签内联样式 ====================
const WECHAT_TAG_STYLES = {
    h2: "font-size:24px;color:#000000;font-weight:bold;margin-top:1.2em;margin-bottom:0.8em;line-height:1.4;",
    h3: "font-size:20px;color:#2f2f2f;font-weight:bold;margin-top:1em;margin-bottom:0.6em;line-height:1.5;",
    h4: "font-size:18px;color:#2f2f2f;font-weight:bold;margin-top:0.8em;margin-bottom:0.4em;line-height:1.5;",
    p: "font-size:16px;color:#3f3f3f;line-height:1.75;letter-spacing:0.5px;margin-top:0.5em;margin-bottom:0.5em;",
    blockquote:
        "font-size:15px;background-color: #f0f7ff;padding:2px 8px; border-radius: 8px; border-left: 5px solid #ba372a;;margin:0 0.8em;line-height:1.75;",
    ul: "font-size:16px;color:#3f3f3f;line-height:1.75;padding-left:24px;margin-top:0.5em;margin-bottom:0.5em;",
    ol: "font-size:16px;color:#3f3f3f;line-height:1.75;padding-left:24px;margin-top:0.5em;margin-bottom:0.5em;",
    li: "margin-top:0.2em;margin-bottom:0.2em;",
    strong: "font-size:17px;color: #ba372a;;font-weight:bold;",
    em: "color: #f8951d;font-style:normal;",
    a: "color: #576b95;text-decoration:none;",
    img: "max-width:100%;height:auto;display:block;margin:0.8em auto;border-radius:4px;",
    hr: "border:none;height:1px;background:linear-gradient(to right,transparent, #3498db,transparent);margin:40px 0;",
    table: "width:100%;border-collapse:collapse;font-size:14px;margin:0.8em 0;",
    th: "background: #f5f5f5;padding:8px 12px;border:1px solid #e8e8e8;font-weight:bold;text-align:left;",
    td: "padding:8px 12px;border:1px solid #e8e8e8;",
    pre: "overflow-x:auto;padding:14px 16px;font-size:13px;line-height:1.5;margin: 0.8em 0;border-radius:6px;border:1px solid #e8e8e8;",
    prep: 'white-space:nowrap;font-family:"JetBrains Mono NL", Consolas, monospace; font-size: 14px; line-height: 1.3;text-align:left;',
    code: 'white-space:pre;font-family:"JetBrains Mono NL", "Microsoft Yahei UI", Consolas,monospace;font-size:15px;background-color: #F5F5F5;color: #ba372a;margin:0 3px;padding:3px;border-radius:6px;font-weight:bold;',
};

/**
 * 使用 highlight.js 高亮代码块，返回带 hljs class 的 HTML
 * @param {string} code - 代码内容
 * @param {string} language - 语言标识
 * @returns {string} 高亮后的 HTML
 */
export function highlightCode(code, language) {
    const validLang = hljs.getLanguage(language) ? language : "plaintext";
    try {
        const result = hljs.highlight(code, {
            language: validLang,
            ignoreIllegals: true,
        });
        return result.value;
    } catch {
        // 降级：使用 auto 检测
        const result = hljs.highlightAuto(code);
        return result.value;
    }
}

/**
 * 将代码块中的 highlight.js class 转换为内联样式
 * @param {string} html - 包含 hljs class 的 HTML 字符串
 * @returns {string} 内联样式化后的 HTML
 */
function inlineCodeHighlightStyles(html) {
    const div = document.createElement("div");
    div.innerHTML = html;

    // 遍历所有带 class 的 span（hljs 生成的 token）
    const spans = div.querySelectorAll("span[class]");
    spans.forEach((span) => {
        const classes = span.className.split(/\s+/);
        let inlineStyle = "";
        classes.forEach((cls) => {
            if (HLJS_INLINE_MAP[cls]) {
                inlineStyle += HLJS_INLINE_MAP[cls];
            }
        });
        if (inlineStyle) {
            // 保留已有的 style（如果有）
            const existingStyle = span.getAttribute("style") || "";
            span.setAttribute("style", inlineStyle + existingStyle);
        }
        // 移除 class，微信会过滤掉
        span.removeAttribute("class");
    });

    // 选中 pre 下的所有 code 元素
    div.querySelectorAll("pre > code").forEach((code) => {
        // 用 code 的所有子节点原地替换掉 code 自身
        code.replaceWith(...code.childNodes);
    });

    // 同时处理 pre 和 code 标签，移除 class
    div.querySelectorAll("pre[class]").forEach((el) => {
        el.removeAttribute("class");
    });

    div.querySelectorAll("pre").forEach((pre) => {
        // 创建替换元素
        const section = document.createElement("section");
        section.style.cssText = WECHAT_TAG_STYLES.pre;
        const code = pre.innerHTML;
        const lines = code.split("\n");
        lines.forEach((line) => {
            line = line.replace(/ (?![^<>]*>)/g, "\u00A0");
            const p = document.createElement("p");
            p.style.cssText = WECHAT_TAG_STYLES.prep;
            p.innerHTML = line;
            section.appendChild(p);
        });
        pre.replaceWith(section);
    });

    return div.innerHTML;
}

/**
 * 为所有微信兼容的标签注入内联样式
 * @param {string} html - HTML 字符串
 * @returns {string} 注入样式后的 HTML
 */
function applyWechatTagStyles(html) {
    const div = document.createElement("div");
    div.innerHTML = html;

    Object.entries(WECHAT_TAG_STYLES).forEach(([tagName, style]) => {
        div.querySelectorAll(tagName).forEach((el) => {
            const existingStyle = el.getAttribute("style") || "";
            // 避免重复注入已存在的样式
            if (!existingStyle.includes(style.substring(0, 20))) {
                el.setAttribute("style", style + existingStyle);
            }
        });
    });

    return div.innerHTML;
}

/**
 * 完整的 Markdown HTML → 微信兼容 HTML 转换
 * @param {string} markdownHtml - marked 解析后的原始 HTML
 * @returns {string} 微信兼容的内联样式 HTML
 */
export function toWechatHTML(markdownHtml) {
    // 第一步：处理代码块中的 hljs class → 内联样式
    let html = inlineCodeHighlightStyles(markdownHtml);
    // 第二步：为段落、标题、引用等标签注入微信兼容样式
    html = applyWechatTagStyles(html);
    return html;
}
