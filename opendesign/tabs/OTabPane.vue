<script lang="ts" setup>
import { useAttrs } from 'vue';
const attrs = useAttrs();
</script>
<template>
  <ElTabPane v-bind="attrs">
    <slot> </slot>
  </ElTabPane>
</template>

<style lang="scss"></style>
