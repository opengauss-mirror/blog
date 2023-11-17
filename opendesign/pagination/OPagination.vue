<script setup lang="ts">
import { useAttrs, computed } from 'vue';

const attrs = useAttrs();

const classNames = computed(() => {
  return `${attrs['poper-class']}`
    ? `${attrs['poper-class']} o-pagination-popper`
    : 'o-pagination-popper';
});
</script>

<template>
  <ElPagination class="o-pagination" v-bind="attrs" :popper-class="classNames">
    <slot></slot>
  </ElPagination>
</template>

<style lang="scss">
.o-pagination {
  --o-pagination-font-color: var(--o-color-text1);
  --o-pagination-font-color_active: var(--o-color-brand1);
  --o-pagination-bg-color: var(--o-color-text5);
  --o-pagination-bg-color_hover: var(--o-color-brand5);
  --o-pagination-bg-color_selected: var(--o-color-brand5);
  --o-pagination-number-border-color_active: var(--o-color-brand1);

  &.el-pagination {
    justify-content: center;
    @media screen and (max-width: 768px) {
      display: none;
    }
    .el-pagination__sizes {
      margin: 0 var(--o-spacing-h8) 0 0;
    }
    .el-input {
      --el-input-bg-color: var(--o-pagination-bg-color);
      --el-input-text-color: var(--o-pagination-font-color);
    }
    .el-input__wrapper {
      border-radius: 0px;
      box-shadow: none;
      height: 36px;
    }
    .el-pagination__editor {
      justify-content: center !important;
    }
    .el-select {
      --el-select-border-color-hover: none;
      --el-select-input-focus-border-color: none;
      & .el-input .el-select__caret {
        color: var(--o-pagination-font-color);
      }
    }
    .el-select-dropdown__wrap {
      background-color: #000 !important;
    }
    .el-pager li {
      color: var(--o-pagination-font-color);
      background: var(--o-pagination-bg-color);
      border-radius: 0px;
      line-height: 36px;
      height: 36px;
      width: 36px;
      &:hover {
        color: var(--o-color-text2) !important;
        background-color: var(--o-pagination-font-color_active);
      }
    }
    .el-pager li.is-active.number {
      background: var(--o-pagination-font-color_active);
      color: var(--o-color-text2);
      font-weight: 300;
      font-size: var(--o-font-size-text);
    }
    .btn-next,
    .btn-prev {
      width: 36px;
      height: 36px;
      color: var(--o-pagination-font-color);
      border-radius: 0px;
      background: var(--o-pagination-bg-color);
    }
    .btn-prev:disabled {
      background: var(--o-color-text5);
    }
    .btn-next {
      margin-right: var(--o-spacing-h5) !important;
    }
    .btn-next:disabled {
      background: var(--o-color-text5);
    }

    .el-pagination__jump {
      height: 36px;
      font-size: var(--o-font-size-text);
      font-weight: 300;
      line-height: var(--o-line-height-text);
      color: var(--o-color-neutral8);
      border-radius: 0px;
      margin-left: var(--o-spacing-h4);
      .el-input__wrapper {
        flex-grow: 0.273;
      }
    }
  }
}
.o-pagination-popper {
  box-shadow: var(--o-shadow-l3);
  &.el-popper {
    box-shadow: none !important;
    --el-popper-border-radius: none;
    border: none;
    .el-popper__arrow {
      display: none;
    }

    .el-select-dropdown__item {
      color: var(--o-color-text1);

      &:hover {
        color: var(--o-color-brand1);
        background: var(--o-color-bg1);
      }
    }
    .hover {
      color: var(--o-color-brand1);
      background: var(--o-color-bg1);
    }

    .el-select-dropdown__item.selected {
      background-color: var(--o-color-bg1);
    }

    .el-select-dropdown__item.selected {
      font-weight: 300;
      color: var(--o-color-brand1);
    }

    .el-select-dropdown__wrap {
      background-color: var(--o-color-bg2);
    }
  }
}
</style>
