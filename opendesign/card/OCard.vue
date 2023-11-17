<script setup lang="ts">
import { useAttrs } from 'vue';

const attrs = useAttrs();
</script>

<template>
  <ElCard class="o-card" v-bind="attrs">
    <slot name="header"></slot>
    <slot></slot>
  </ElCard>
</template>

<style lang="scss">
.o-card {
  --o-card-font-color: var(--o-color-text1);
  --o-card-bg-color: var(--o-color-fill2);
  --o-card-division-color: var(--o-color-division1);
  --o-card-bg-color_hover: var(--o-color-fill2_hover);

  &.el-card {
    color: var(--o-card-font-color);
    border-radius: 0;
    background-color: var(--o-card-bg-color);
    transition: none;
    border: none;

    &.is-always-shadow {
      box-shadow: var(--o-shadow-l2);
    }

    &.is-hover-shadow {
      box-shadow: var(--o-shadow-l2);
      &:hover,
      &:focus {
        @media screen and (min-width: 1100px) {
          box-shadow: var(--o-shadow-l2_hover);
          background-color: var(--o-card-bg-color_hover);
        }
      }
    }

    .el-card__header {
      border-bottom: 1px solid var(--o-card-division-color);
    }
  }
}
</style>
