<template>
    <div class="app-container">
        <!-- 顶部工具栏 -->
        <div class="toolbar">
            <span class="brand">📝 公众号 Markdown 编辑器</span>
            <button
                :class="['btn-width', { active: previewWidth === 'desktop' }]"
                @click="previewWidth = 'desktop'"
            >
                宽预览
            </button>
            <button
                :class="['btn-width', { active: previewWidth === 'mobile' }]"
                @click="previewWidth = 'mobile'"
            >
                手机预览
            </button>
            <button class="btn-clear" @click="clearContent">清空</button>
            <button class="btn-copy" @click="handleCopyHtml">
                📋 复制HTML源代码
            </button>
            <button class="btn-copy" @click="handleCopy">
                📋 复制为微信样式
            </button>
        </div>

        <!-- 编辑主体 -->
        <div class="editor-main">
            <!-- 左侧：Markdown 输入区 -->
            <div class="editor-panel" :style="{ flex: `0 0 ${leftWidth}` }">
                <div class="panel-header">Markdown 编辑区</div>
                <Toolbar
                    :textareaRef="textareaRef"
                    :modelValue="rawMarkdown"
                    @action="handleToolbarAction"
                    @update:modelValue="rawMarkdown = $event"
                />
                <textarea
                    ref="textareaRef"
                    v-model="rawMarkdown"
                    placeholder="在此编写 Markdown 文章...&#10;&#10;支持标题、代码块、引用、列表、图片等语法"
                    spellcheck="false"
                    @scroll="handleLeftScroll"
                ></textarea>
            </div>

            <!-- 拖拽手柄 -->
            <div class="drag-handle" @mousedown="handleDragStart"></div>

            <!-- 右侧：实时预览区 -->
            <div
                class="preview-panel"
                ref="previewPanelRef"
                @scroll="handleRightScroll"
                :style="{ flex: 1 }"
            >
                <div class="panel-header">实时预览（微信风格）</div>
                <div
                    :class="[
                        'preview-wrapper',
                        { mobile: previewWidth === 'mobile' },
                    ]"
                    v-html="wechatHTML"
                ></div>
            </div>
        </div>

        <!-- Toast 提示 -->
        <div v-if="toastVisible" class="toast">{{ toastMessage }}</div>
    </div>
</template>

<script setup>
    import { ref, computed } from "vue";
    import { marked } from "marked";
    import { toWechatHTML, highlightCode } from "@/utils/styleInliner.js";
    import { copyRichHTML, copyHTML } from "@/utils/clipboard.js";
    import Toolbar from "./components/Toolbar.vue";

    // ============ 状态 ============
    const rawMarkdown = ref(`## 二级标题
### 三级标题
#### 四级标题
正文内容
> 注释块内容
- 无序列表
1. 有序列表
**加粗字体**，*斜体*，\`pnpm install marked\`，http://localhost
***
|表格|表头|
|---|---|
|表身|单元格|
\`\`\`js
const msg = ref("Hello World!!!")
const computedRules = computed(() => {
  const baseRules = { name: [{ required: true }] };
  if (formState.payType === 'bank') {
    baseRules.bankAccount = [{ required: true, pattern: /^\d{16,19}$/ }];
  }
  return baseRules;
});
\`\`\`
`);
    // ============ textarea 引用 ============
    const textareaRef = ref(null);

    // ============ 撤销栈 ============
    const undoStack = ref([]);

    /** 保存当前状态到撤销栈（工具栏操作前调用） */
    function pushUndoState() {
        undoStack.value.push(rawMarkdown.value);
    }

    /** 撤销上一次工具栏操作 */
    function handleUndo() {
        if (undoStack.value.length === 0) {
            showToast("没有可撤销的操作");
            return;
        }
        rawMarkdown.value = undoStack.value.pop();
        showToast("已撤销");
    }

    // ============ 工具栏操作函数 ============
    import { nextTick } from "vue";

    /** 获取当前光标位置和选中文本 */
    function getTextareaSelection() {
        const el = textareaRef.value;
        if (!el) return { start: 0, end: 0, selected: "" };
        return {
            start: el.selectionStart,
            end: el.selectionEnd,
            selected: el.value.substring(el.selectionStart, el.selectionEnd),
            scrollTop: el.scrollTop,
        };
    }

    /** 替换选中文本（或插入新文本），并恢复光标 */
    function insertMarkdown(
        wrapper,
        placeholder = "文本",
        cursorOffset = null,
    ) {
        const el = textareaRef.value;
        if (!el) return;

        const { start, end, selected, scrollTop } = getTextareaSelection();
        const before = rawMarkdown.value.substring(0, start);
        const after = rawMarkdown.value.substring(end);

        let replacement, newCursorPos;

        if (wrapper.includes("$1")) {
            // 支持占位符 $1（用于包裹类：加粗、斜体等）
            const content = selected || placeholder;
            replacement = wrapper.replace("$1", content);
            newCursorPos = start + replacement.length;
        } else {
            // 直接插入（标题前缀、列表、分割线等）
            replacement = wrapper;
            newCursorPos = start + replacement.length;
        }

        rawMarkdown.value = before + replacement + after;

        nextTick(() => {
            el.focus();
            // 如果有选中文本被包裹，光标放在替换内容末尾
            if (selected && wrapper.includes("$1")) {
                el.selectionStart = el.selectionEnd =
                    start + replacement.length;
            } else if (cursorOffset !== null) {
                el.selectionStart = el.selectionEnd = start + cursorOffset;
            } else {
                el.selectionStart = el.selectionEnd = newCursorPos;
            }
            // 强制恢复滚动条位置
            el.scrollTop = scrollTop;
        });
    }

    /** 处理工具栏动作 */
    function handleToolbarAction({ type, level, language }) {
        // 撤销操作单独处理，不产生新的撤销记录
        if (type === "undo") {
            handleUndo();
            return;
        }

        // 其他操作前保存撤销状态
        pushUndoState();

        const { selected } = getTextareaSelection();

        switch (type) {
            case "bold":
                insertMarkdown("**$1**", selected || "粗体文本");
                break;
            case "italic":
                insertMarkdown("*$1*", selected || "斜体文本");
                break;
            case "strikethrough":
                insertMarkdown("~~$1~~", selected || "删除文本");
                break;
            case "inlineCode":
                insertMarkdown("`$1`", selected || "代码");
                break;
            case "heading":
                insertMarkdown(
                    `${"#".repeat(level)} ` + (selected || `标题${level}`),
                );
                break;
            case "unorderedList":
                insertMarkdown("\n- " + (selected || "列表项"));
                break;
            case "orderedList":
                insertMarkdown("\n1. " + (selected || "列表项"));
                break;
            case "blockquote":
                insertMarkdown("\n> " + (selected || "引用内容"));
                break;
            case "link":
                insertMarkdown(`[${selected || "链接文字"}](url)`);
                break;
            case "image":
                insertMarkdown(`![${selected || "图片描述"}](url)`);
                break;
            case "hr":
                insertMarkdown("\n---\n");
                break;
            case "codeBlock":
                const lang = language || "python";
                if (selected) {
                    // 有选中文本：包裹在代码块中，光标停在选中文本末尾
                    insertMarkdown(`\n\`\`\`${lang}\n$1\n\`\`\`\n`, "");
                } else {
                    // 无选中文本：插入空代码块，光标自动定位到中间，方便直接粘贴
                    const cursorOffset = 5 + lang.length; // 即 \n```python\n 之后的那个空行位置
                    insertMarkdown(
                        `\n\`\`\`${lang}\n\n\`\`\`\n`,
                        "",
                        cursorOffset,
                    );
                }
                break;
        }
    }

    const previewWidth = ref("desktop");
    const toastVisible = ref(false);
    const toastMessage = ref("");

    // ============ 左右面板引用 ============
    const previewPanelRef = ref(null);

    // ============ 同步滚动 ============
    const isLeftScrolling = ref(false);
    const isRightScrolling = ref(false);

    /** 左侧滚动 → 同步到右侧 */
    function handleLeftScroll() {
        if (isRightScrolling.value) return; // 防止右侧滚动时循环触发
        const leftEl = textareaRef.value;
        const rightEl = previewPanelRef.value;
        if (!leftEl || !rightEl) return;

        const ratio =
            leftEl.scrollTop / (leftEl.scrollHeight - leftEl.clientHeight);
        if (isNaN(ratio)) return;

        isLeftScrolling.value = true;
        rightEl.scrollTop =
            ratio * (rightEl.scrollHeight - rightEl.clientHeight);
        requestAnimationFrame(() => {
            isLeftScrolling.value = false;
        });
    }

    /** 右侧滚动 → 同步到左侧 */
    function handleRightScroll() {
        if (isLeftScrolling.value) return;
        const leftEl = textareaRef.value;
        const rightEl = previewPanelRef.value;
        if (!leftEl || !rightEl) return;

        const ratio =
            rightEl.scrollTop / (rightEl.scrollHeight - rightEl.clientHeight);
        if (isNaN(ratio)) return;

        isRightScrolling.value = true;
        leftEl.scrollTop = ratio * (leftEl.scrollHeight - leftEl.clientHeight);
        requestAnimationFrame(() => {
            isRightScrolling.value = false;
        });
    }

    // ============ 拖拽分栏 ============
    const leftWidth = ref("65%"); // 左侧面板宽度百分比
    const isDragging = ref(false);

    function handleDragStart(e) {
        isDragging.value = true;
        document.body.classList.add("dragging");
        document.addEventListener("mousemove", handleDragMove);
        document.addEventListener("mouseup", handleDragEnd);
        e.preventDefault();
    }

    function handleDragMove(e) {
        if (!isDragging.value) return;
        const editorMain = document.querySelector(".editor-main");
        if (!editorMain) return;

        const rect = editorMain.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const totalWidth = rect.width;

        // 限制最小/最大宽度（20% ~ 80%）
        let percent = (x / totalWidth) * 100;
        percent = Math.max(20, Math.min(80, percent));
        leftWidth.value = `${percent}%`;
    }

    function handleDragEnd() {
        isDragging.value = false;
        document.body.classList.remove("dragging");
        document.removeEventListener("mousemove", handleDragMove);
        document.removeEventListener("mouseup", handleDragEnd);
    }

    // ============ 配置 marked ============
    const renderer = new marked.Renderer();

    // 自定义代码块渲染：使用 highlight.js 高亮
    renderer.code = function ({ text, lang }) {
        const highlighted = highlightCode(text, lang);
        return `<pre><code class="hljs language-${lang || ""}">${highlighted}</code></pre>`;
    };

    marked.setOptions({
        renderer,
        breaks: true, // 支持换行转 <br>
        gfm: true, // 启用 GitHub 风格 Markdown
    });

    // ============ 计算属性：微信兼容 HTML ============
    const wechatHTML = computed(() => {
        if (!rawMarkdown.value.trim()) {
            return '<p style="color:#bbb;text-align:center;padding:40px 0;">在左侧输入 Markdown，这里会实时预览微信样式效果</p>';
        }
        // 1. Markdown → HTML
        const rawHTML = marked.parse(rawMarkdown.value);
        // 2. HTML → 微信兼容的内联样式 HTML
        return toWechatHTML(rawHTML);
    });

    // ============ 方法 ============
    async function handleCopy() {
        if (!rawMarkdown.value.trim()) {
            showToast("请先输入内容再复制");
            return;
        }

        const success = await copyRichHTML(wechatHTML.value);
        if (success) {
            showToast("✅ 复制成功！直接到公众号后台粘贴即可");
        } else {
            showToast("❌ 复制失败，请重试");
        }
    }
    async function handleCopyHtml() {
        if (!rawMarkdown.value.trim()) {
            showToast("请先输入内容再复制");
            return;
        }

        const success = await copyHTML(wechatHTML.value);
        if (success) {
            showToast("✅ 复制成功！直接到公众号后台粘贴即可");
        } else {
            showToast("❌ 复制失败，请重试");
        }
    }

    function clearContent() {
        if (rawMarkdown.value.trim() && !confirm("确定要清空所有内容吗？")) {
            return;
        }
        rawMarkdown.value = "";
        showToast("已清空");
    }

    function showToast(msg) {
        toastMessage.value = msg;
        toastVisible.value = true;
        setTimeout(() => {
            toastVisible.value = false;
        }, 2000);
    }
</script>
