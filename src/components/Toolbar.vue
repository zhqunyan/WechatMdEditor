<template>
    <div class="md-toolbar">
        <!-- 撤销 & 查找替换 -->
        <button
            class="tb-btn"
            title="撤销工具栏操作"
            @click="$emit('action', { type: 'undo' })"
        >
            ↶
        </button>
        <button
            class="tb-btn"
            :class="{ 'tb-btn-active': showSearch }"
            title="查找和替换"
            @click="toggleSearch"
        >
            🔍
        </button>

        <span class="tb-divider"></span>

        <!-- 行内格式 -->
        <button
            class="tb-btn"
            title="加粗 Ctrl+B"
            @click="$emit('action', { type: 'bold' })"
        >
            <b>B</b>
        </button>
        <button
            class="tb-btn"
            title="斜体 Ctrl+I"
            @click="$emit('action', { type: 'italic' })"
        >
            <i>I</i>
        </button>
        <button
            class="tb-btn"
            title="删除线"
            @click="$emit('action', { type: 'strikethrough' })"
        >
            <s>S</s>
        </button>
        <button
            class="tb-btn"
            title="行内代码"
            @click="$emit('action', { type: 'inlineCode' })"
        >
            &lt;/&gt;
        </button>

        <span class="tb-divider"></span>

        <!-- 标题 -->
        <button
            class="tb-btn"
            title="二级标题"
            @click="$emit('action', { type: 'heading', level: 2 })"
        >
            H2
        </button>
        <button
            class="tb-btn"
            title="三级标题"
            @click="$emit('action', { type: 'heading', level: 3 })"
        >
            H3
        </button>
        <button
            class="tb-btn"
            title="四级标题"
            @click="$emit('action', { type: 'heading', level: 4 })"
        >
            H4
        </button>

        <span class="tb-divider"></span>

        <!-- 列表 -->
        <button
            class="tb-btn"
            title="无序列表"
            @click="$emit('action', { type: 'unorderedList' })"
        >
            • ≡
        </button>
        <button
            class="tb-btn"
            title="有序列表"
            @click="$emit('action', { type: 'orderedList' })"
        >
            1.
        </button>
        <button
            class="tb-btn"
            title="引用"
            @click="$emit('action', { type: 'blockquote' })"
        >
            ❝
        </button>

        <span class="tb-divider"></span>

        <!-- 链接 & 图片 -->
        <button
            class="tb-btn"
            title="插入链接"
            @click="$emit('action', { type: 'link' })"
        >
            🔗
        </button>
        <button
            class="tb-btn"
            title="插入图片"
            @click="$emit('action', { type: 'image' })"
        >
            🖼
        </button>

        <span class="tb-divider"></span>

        <!-- 分割线 -->
        <button
            class="tb-btn"
            title="分割线"
            @click="$emit('action', { type: 'hr' })"
        >
            —
        </button>

        <!-- 代码块 + 语言选择 -->
        <div class="tb-dropdown">
            <button class="tb-btn tb-code-btn" title="插入代码块">
                📝 代码块
            </button>
            <div class="tb-dropdown-menu">
                <button
                    v-for="lang in languages"
                    :key="lang.value"
                    class="tb-dropdown-item"
                    @click="
                        $emit('action', {
                            type: 'codeBlock',
                            language: lang.value,
                        })
                    "
                >
                    {{ lang.label }}
                </button>
            </div>
        </div>
        <!-- 查找替换面板 -->
        <SearchReplace
            v-if="showSearch"
            :textareaRef="props.textareaRef"
            :modelValue="props.modelValue"
            @update:modelValue="emit('update:modelValue', $event)"
            @close="showSearch = false"
            ref="searchReplaceRef"
        />
    </div>
</template>

<script setup>
    import { ref, nextTick } from "vue";
    import SearchReplace from "./SearchReplace.vue";

    const props = defineProps({
        textareaRef: { type: Object, default: null },
        modelValue: { type: String, default: "" },
    });

    const emit = defineEmits(["action", "update:modelValue"]);

    const showSearch = ref(false);
    const searchReplaceRef = ref(null);

    const languages = [
        { label: "Python", value: "python" },
        { label: "JavaScript", value: "javascript" },
        { label: "TypeScript", value: "typescript" },
        { label: "HTML", value: "html" },
        { label: "CSS", value: "css" },
        { label: "Java", value: "java" },
        { label: "Go", value: "go" },
        { label: "Rust", value: "rust" },
        { label: "SQL", value: "sql" },
        { label: "Bash", value: "bash" },
        { label: "JSON", value: "json" },
        { label: "YAML", value: "yaml" },
        { label: "Markdown", value: "markdown" },
        { label: "纯文本", value: "plaintext" },
    ];
    function toggleSearch() {
        showSearch.value = !showSearch.value;
        if (showSearch.value) {
            nextTick(() => searchReplaceRef.value?.focusSearch());
        }
    }
</script>
