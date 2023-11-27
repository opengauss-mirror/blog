<script setup lang="ts">
import { useAttrs } from 'vue';

const attrs = useAttrs();
</script>

<template>
  <ElTableColumn class="o-table-column" v-bind="attrs"> </ElTableColumn>
</template>

<style lang="scss"></style>
