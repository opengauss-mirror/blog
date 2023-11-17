<script lang="ts" setup>
import { useAttrs } from 'vue';
const attrs = useAttrs();
</script>
<template>
  <ElOption v-bind="attrs" class="o-option">
    <slot> </slot>
  </ElOption>
</template>

<style lang="scss">
.el-popper__arrow {
  display: none;
}
.el-popper.o-select-dropdown {
  border: none;
  border-radius: 0 !important;
  background-color: var(--o-color-bg2);
  .o-select-dropdown {
    max-width: 500px;
  }
  .o-option.hover {
    background-color: var(--o-color-bg4);
  }
}
</style>
