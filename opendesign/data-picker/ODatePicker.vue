<script setup lang="ts">
import { useAttrs } from 'vue';

const attrs = useAttrs();
</script>

<template>
  <ElDatePicker class="o-date-picker" v-bind="attrs" />
</template>

<style lang="scss">
.o-date-picker {
  --o-date-picker-height: 38px;
  --o-date-picker-border-color: var(--o-color-border1);
  --o-date-picker-font-color: var(--o-color-text1);
  --o-date-picker-font-size: var(--o-font-size-text);
  --o-date-picker-line-height: var(--o-line-height-text);
  --o-date-picker-color-bg: var(--o-color-bg2);
  --o-date-picker-brand: var(--o-color-brand1);
  &.el-input {
    font-size: var(--o-date-picker-font-size);
    line-height: var(--o-date-picker-font-size);
    height: var(--o-date-picker-height);
    .el-input__wrapper {
      border-radius: 0;
      padding: 1px 15px;
      background-color: var(--o-date-picker-color-bg);
      box-shadow: 0 0 0 1px var(--o-date-picker-border-color) inset;

      .el-input__inner {
        height: var(--o-date-picker-height);
        line-height: var(--o-date-picker-font-size);
        color: var(--o-date-picker-font-color);
      }
      &.is-focus {
        box-shadow: 0 0 0 1px var(--o-date-picker-brand) inset;
      }
    }
  }
}
</style>
