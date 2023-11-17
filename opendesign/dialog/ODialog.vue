<script setup lang="ts">
import { useAttrs } from 'vue';

const attrs = useAttrs();
</script>

<template>
  <ElDialog class="o-dialog" v-bind="attrs">
    <slot></slot>
  </ElDialog>
</template>

<style lang="scss">
.o-dialog {
  --o-dialog-font-color: var(--o-color-text1);
  --o-dialog-bg-color: var(--o-color-fill2);
  --o-dialog-division-color: var(--o-color-division1);

  &.el-dialog {
    color: var(--o-dialog-font-color);
    border-radius: 0;
    background-color: var(--o-dialog-bg-color);
    transition: none;
    border: none;
    @media screen and (max-width: 768px) {
      width: 90%;
    }
    .el-dialog__title {
      color: var(--o-color-text1);
    }
  }
}
</style>
