<script setup lang="ts">
import { useAttrs } from 'vue';
const attrs = useAttrs();
</script>

<template>
  <ElTabs class="o-tabs" v-bind="attrs">
    <slot> </slot>
  </ElTabs>
</template>

<style lang="scss">
.o-tabs {
  --o-tabs-font: var(--o-color-text1);
  --o-tabs-color: var(--o-color-text1);
  --o-tabs-color_hover: var(--o-color-brand1);
  --o-font-color: var(--o-tabs-font);
  &.el-tabs {
    .el-tabs__header {
      margin-bottom: 0;
    }
    .el-tabs__nav-wrap {
      &::after {
        display: none;
      }
      .el-tabs__item {
        color: var(--o-tabs-color);
        padding-top: 10px;
        padding-bottom: 10px;
        font-size: var(--o-font-size-h8);
        line-height: var(--o-line-height-h8);
        height: auto;
        &:hover {
          color: var(--o-tabs-color_hover);
        }
      }
      .el-tabs__item.is-active {
        color: var(--o-tabs-color_hover);
      }
    }
    @media screen and (max-width: 768px) {
      .el-tabs__nav-wrap {
        .el-tabs__item {
          padding-top: 6px;
          padding-bottom: 6px;
          font-size: var(--o-font-size-text);
          line-height: var(--o-line-height-text);
        }
      }
    }
  }
}
</style>
