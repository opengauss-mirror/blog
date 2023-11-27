<script setup lang="ts">
import { useAttrs } from 'vue';

const attrs = useAttrs();
</script>

<template>
  <ElTimeSelect class="o-time-select" v-bind="attrs" />
</template>

<style lang="scss">
.o-time-select {
  --o-time-select-height: 38px;
  --o-time-select-border-color: var(--o-color-border1);
  --o-time-select-font-color: var(--o-color-text1);
  --o-time-select-font-size: var(--o-font-size-text);
  --o-time-select-line-height: var(--o-line-height-text);
  --o-time-select-color-bg: var(--o-color-bg2);
  --o-time-select-brand: var(--o-color-brand1);
  .el-input {
    font-size: var(--o-time-select-font-size);
    line-height: var(--o-time-select-font-size);
    height: var(--o-time-select-height);
    .el-input__wrapper {
      border-radius: 0;
      padding: 1px 15px;
      background-color: var(--o-time-select-color-bg);
      box-shadow: 0 0 0 1px var(--o-time-select-border-color) inset;

      .el-input__inner {
        height: var(--o-time-select-height);
        line-height: var(--o-time-select-font-size);
        color: var(--o-time-select-font-color);
      }
      &.is-focus {
        box-shadow: 0 0 0 1px var(--o-time-select-brand) inset;
      }
    }
  }
}
</style>
