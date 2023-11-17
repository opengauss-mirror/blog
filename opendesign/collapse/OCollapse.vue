<script setup lang="ts">
import { useAttrs } from 'vue';

const attrs = useAttrs();
</script>

<template>
  <ElCollapse class="o-collapse" v-bind="attrs">
    <slot></slot>
  </ElCollapse>
</template>

<style lang="scss">
.o-collapse {
  --o-collapse-color-bg: var(--o-color-bg2);
  --o-collapse-color-bg1: var(--o-color-bg1);
  --o-collapse-color-border: var(--o-color-brand1);
  --o-collapse-color-border1: var(--o-color-division1);
  --o-collapse-color-text: var(--o-color-text1);
  --o-collapse-padding-left: var(--o-spacing-h6);
  --o-collapse-padding: var(--o-spacing-h8);
  --o-collapse-font-size: var(--o-font-size-h7);
  --o-collapse-font-size-icon: var(--o-font-size-h8);
  --o-collapse-line-height: var(--o-line-height-h7);
  --o-collapse-color-bg2: var(--o-color-bg4);
  --o-collapse-color-brand1: var(--o-color-brand1);

  &.el-collapse {
    border-top: none;
    .el-collapse-item__header {
      color: var(--o-collapse-color-text);
      padding-left: var(--o-collapse-padding-left);
      padding-right: var(--o-collapse-padding-left);
      background-color: var(--o-collapse-color-bg);
      font-size: var(--o-collapse-font-size);
      line-height: var(--o-collapse-line-height);
      // border-left: 2px solid var(--o-collapse-color-border);
      border-bottom: none;
      position: relative;
      &::after {
        position: absolute;
        left: var(--o-spacing-h6);
        right: var(--o-spacing-h6);
        bottom: 0;
        content: '';
        height: 1px;
        background: var(--o-collapse-color-border1);
      }
      .el-collapse-item__arrow {
        margin: 0 0 0 auto;
        font-size: var(--o-collapse-font-size-icon);
      }
    }
    .el-collapse-item__wrap {
      border-bottom: none;
      .el-collapse-item__content {
        background-color: var(--o-collapse-color-bg2);
        color: var(--o-collapse-color-text);
        padding: var(--o-collapse-padding);
      }
    }
  }
}
</style>
