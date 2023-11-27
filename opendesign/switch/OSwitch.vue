<script setup lang="ts">
import { useAttrs } from 'vue';

const attrs = useAttrs();
</script>

<template>
  <el-switch class="o-switch" v-bind="attrs"></el-switch>
</template>

<style lang="scss">
.o-switch {
  --o-switch-font-color: var(--o-color-text4);
  --o-switch-font-color-active: var(--o-color-brand1);
  --o-switch-on-color: var(--o-color-brand1);
  &.el-switch {
    .el-switch__label {
      color: var(--o-switch-font-color);
    }
    .el-switch__label.is-active {
      color: var(--o-switch-font-color-active);
      font-weight: 600;
    }
    &.is-checked .el-switch__core {
      background-color: var(--o-switch-on-color);
      border-color: var(--o-switch-on-color, var(--o-switch-on-color));
    }
  }
}
</style>
