/**
 * 将 HTML 内容复制到系统剪贴板（同时写入纯文本和富文本）
 * 确保粘贴到微信公众号编辑器时格式不丢失
 * @param {string} html - 微信兼容的内联样式 HTML
 * @returns {Promise<boolean>} 是否复制成功
 */
export async function copyRichHTML(html) {
    try {
        // 从 HTML 中提取纯文本作为 fallback
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = html;
        const plainText = tempDiv.textContent || tempDiv.innerText || "";

        // 使用 Clipboard API 同时写入 HTML 和纯文本
        const clipboardItem = new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([plainText], { type: "text/plain" }),
        });

        await navigator.clipboard.write([clipboardItem]);
        return true;
    } catch (err) {
        // 降级方案：使用 execCommand（兼容旧浏览器）
        console.warn("Clipboard API 失败，尝试降级方案:", err);
        try {
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.top = "-9999px";
            iframe.style.left = "-9999px";
            document.body.appendChild(iframe);

            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write(html);
            doc.close();

            // 同时设置纯文本
            const plainDiv = doc.createElement("div");
            plainDiv.textContent = html.replace(/<[^>]+>/g, "");
            doc.body.appendChild(plainDiv);

            doc.execCommand("selectAll");
            doc.execCommand("copy");
            document.body.removeChild(iframe);
            return true;
        } catch (fallbackErr) {
            console.error("复制失败:", fallbackErr);
            return false;
        }
    }
}

export async function copyHTML(html) {
    try {
        // 使用 Clipboard API 同时写入 HTML 和纯文本
        const clipboardItem = new ClipboardItem({
            "text/plain": new Blob([html], { type: "text/plain" }),
        });

        await navigator.clipboard.write([clipboardItem]);
        return true;
    } catch (err) {
        // 降级方案：使用 execCommand（兼容旧浏览器）
        console.warn("Clipboard API 失败，尝试降级方案:", err);
        try {
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.top = "-9999px";
            iframe.style.left = "-9999px";
            document.body.appendChild(iframe);

            const doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.open();
            doc.write(html);
            doc.close();

            doc.execCommand("selectAll");
            doc.execCommand("copy");
            document.body.removeChild(iframe);
            return true;
        } catch (fallbackErr) {
            console.error("复制失败:", fallbackErr);
            return false;
        }
    }
}
