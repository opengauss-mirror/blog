<script setup lang="ts">
import { useAttrs } from 'vue';

const attrs = useAttrs();
</script>

<template>
  <ElCollapseItem class="o-collapse-item" v-bind="attrs">
    <template #title>
      <slot name="title"></slot>
    </template>
    <slot></slot>
  </ElCollapseItem>
</template>

<style lang="scss"></style>
