<script setup lang="ts">
import { useAttrs } from 'vue';

const attrs = useAttrs();
</script>

<template>
  <ElInput class="o-input" v-bind="attrs"></ElInput>
</template>

<style lang="scss">
.o-input {
  --o-input-height: 36px;
  --o-input-border-color: var(--o-color-border1);
  --o-input-font-color: var(--o-color-text1);
  --o-input-font-size: var(--o-font-size-text);
  --o-input-line-height: var(--o-line-height-text);
  --o-input-color-bg: var(--o-color-bg2);
  --o-input-brand: var(--o-color-brand1);
  --o-input-disabled-color: var(--o-color-bg3);
  --o-input-disabled-border-color: var(--o-color-black);
  &.el-input {
    font-size: var(--o-input-font-size);
    line-height: var(--o-input-font-size);

    .el-input__wrapper {
      border-radius: 0;
      padding: 1px 15px;
      background-color: var(--o-input-color-bg);
      box-shadow: 0 0 0 1px var(--o-input-border-color) inset;

      .el-input__inner {
        height: var(--o-input-height);
        line-height: var(--o-input-font-size);
        color: var(--o-input-font-color);
      }
      &.is-focus {
        box-shadow: 0 0 0 1px var(--o-input-brand) inset;
      }
    }
  }
  &.el-textarea {
    .el-textarea__inner {
      box-shadow: 0 0 0 1px var(--o-input-border-color) inset;
      border-radius: 0;
      background-color: var(--o-input-color-bg);
      color: var(--o-input-font-color);
    }
  }
  &.is-disabled {
    .el-input__wrapper {
      box-shadow: 0 0 0 1px var(--o-input-disabled-border-color) inset;
      background: var(--o-input-disabled-color);

      .el-input__inner {
        color: var(--o-input-font-color);
        -webkit-text-fill-color: var(--o-input-font-color);
      }
    }
  }
}
</style>
