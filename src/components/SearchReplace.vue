<template>
    <div class="search-replace-bar">
        <button class="sr-close" @click="$emit('close')" title="关闭">✕</button>

        <div class="sr-row">
            <label class="sr-label">查找</label>
            <input
                ref="searchInputRef"
                v-model="searchText"
                class="sr-input"
                placeholder="输入查找内容"
                @keydown.enter="findNext"
            />
            <span class="sr-count" v-if="searchText">{{ matchInfo }}</span>
        </div>

        <div class="sr-row">
            <label class="sr-label">替换</label>
            <input
                v-model="replaceText"
                class="sr-input"
                placeholder="输入替换内容"
                @keydown.enter="replace"
            />
        </div>

        <div class="sr-actions">
            <button class="sr-btn" @click="findPrev" title="上一个">
                ◂ 上一个
            </button>
            <button class="sr-btn" @click="findNext" title="下一个">
                下一个 ▸
            </button>
            <button class="sr-btn sr-btn-replace" @click="replace">替换</button>
            <button class="sr-btn sr-btn-replace-all" @click="replaceAll">
                全部替换
            </button>
        </div>
    </div>
</template>

<script setup>
    import { ref, computed, nextTick } from "vue";

    const props = defineProps({
        textareaRef: { type: Object, default: null },
        modelValue: { type: String, default: "" },
    });

    const emit = defineEmits(["update:modelValue", "close"]);

    const searchText = ref("");
    const replaceText = ref("");
    const searchInputRef = ref(null);

    // 统计匹配数量
    const matchInfo = computed(() => {
        if (!searchText.value) return "";
        const text = props.modelValue;
        const count = text.split(searchText.value).length - 1;
        return count > 0 ? `${count} 处匹配` : "无匹配";
    });

    /** 在 textarea 中查找并选中 */
    function findInTextarea(fromIndex = null) {
        const el = props.textareaRef;
        if (!el || !searchText.value) return false;
        const text = el.value;
        let startPos = fromIndex !== null ? fromIndex : el.selectionEnd;
        let foundIndex = text.indexOf(searchText.value, startPos);
        if (foundIndex === -1 && startPos > 0) {
            foundIndex = text.indexOf(searchText.value, 0);
        }
        if (foundIndex !== -1) {
            el.focus();
            el.selectionStart = foundIndex;
            el.selectionEnd = foundIndex + searchText.value.length;
            // 滚动到可见位置
            const lineHeight = 24;
            const lineNum = text.substring(0, foundIndex).split("\n").length;
            el.scrollTop = lineNum * lineHeight - el.clientHeight / 2;
            return true;
        }
        return false;
    }

    /** 查找下一个 */
    function findNext() {
        const el = props.textareaRef;
        if (!el) return;
        const found = findInTextarea(el.selectionEnd);
        if (!found && searchText.value) {
            findInTextarea(0);
        }
    }

    /** 查找上一个 */
    function findPrev() {
        const el = props.textareaRef;
        if (!el || !searchText.value) return;
        const text = el.value;
        const currentPos = el.selectionStart;
        const lastIndex = text.lastIndexOf(searchText.value, currentPos - 1);
        if (lastIndex !== -1) {
            el.focus();
            el.selectionStart = lastIndex;
            el.selectionEnd = lastIndex + searchText.value.length;
            el.scrollTop =
                text.substring(0, lastIndex).split("\n").length * 24 -
                el.clientHeight / 2;
        } else {
            // 从末尾往前找
            const tailIndex = text.lastIndexOf(searchText.value);
            if (tailIndex !== -1 && tailIndex !== currentPos) {
                el.focus();
                el.selectionStart = tailIndex;
                el.selectionEnd = tailIndex + searchText.value.length;
            }
        }
    }

    /** 替换当前选中 */
    function replace() {
        const el = props.textareaRef;
        if (!el || !searchText.value) return;
        const selected = el.value.substring(el.selectionStart, el.selectionEnd);
        if (selected === searchText.value) {
            const before = el.value.substring(0, el.selectionStart);
            const after = el.value.substring(el.selectionEnd);
            emit("update:modelValue", before + replaceText.value + after);
            nextTick(() => {
                el.selectionStart = el.selectionEnd =
                    before.length + replaceText.value.length;
                findNext();
            });
        } else {
            findNext();
        }
    }

    /** 全部替换 */
    function replaceAll() {
        if (!searchText.value) return;
        const newText = props.modelValue
            .split(searchText.value)
            .join(replaceText.value);
        emit("update:modelValue", newText);
    }

    // 打开面板时自动聚焦查找输入框
    defineExpose({
        focusSearch: () => nextTick(() => searchInputRef.value?.focus()),
    });
</script>
