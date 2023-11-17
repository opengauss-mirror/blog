<script setup lang="ts">
import { useAttrs } from 'vue';

const attrs = useAttrs();
</script>

<template>
  <ElInput class="o-search" v-bind="attrs">
    <template #prefix>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        viewBox="0 0 32 32"
      >
        <path
          fill="currentColor"
          d="M14.667 4c5.891 0 10.667 4.776 10.667 10.667 0 2.464-0.836 4.734-2.239 6.54l4.448 4.45-1.886 1.886-4.451-4.448c-1.806 1.404-4.075 2.239-6.54 2.239-5.891 0-10.667-4.776-10.667-10.667s4.776-10.667 10.667-10.667zM14.667 6.667c-4.418 0-8 3.582-8 8s3.582 8 8 8c4.418 0 8-3.582 8-8s-3.582-8-8-8z"
        ></path>
      </svg>
    </template>
    <template #suffix>
      <slot name="suffix"></slot>
    </template>
  </ElInput>
</template>

<style lang="scss">
.o-search {
  --o-search-height: 36px;
  --o-search-border-color: var(--o-color-border);
  --o-search-font-color: var(--o-color-text1);
  --o-search-font-size: var(--o-font-size-text);
  --o-search-line-height: var(--o-line-height-text);
  --o-search-color-bg: var(--o-color-bg2);
  --o-search-shadow: var(--o-shadow-l1);

  &.el-input {
    font-size: var(--o-font-size-text);
    line-height: var(--o-search-font-size);

    .el-input__wrapper {
      border-radius: 0;
      padding: 1px 8px;
      background-color: var(--o-search-color-bg);
      box-shadow: var(--o-search-shadow);
      .el-input__prefix-inner {
        font-size: var(--o-font-size-h5);
        line-height: var(--o-line-heihgt-h5);
        color: var(--o-color-text4);
      }

      svg {
        width: 1em;
        height: 1em;
        color: currentColor;
        vertical-align: top;
      }

      .el-input__inner {
        height: var(--o-search-height);
        line-height: var(--o-search-font-size);
        color: var(--o-search-font-color);
      }
    }
  }
}
</style>
