<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps({
  pcTop: {
    type: Number,
    default: 64,
  },
  mobileTop: {
    type: Number,
    default: 40,
  },
});

const mobilePaddingTop = computed(() => {
  return props.mobileTop + 'px';
});

const pcPaddingTop = computed(() => {
  return props.pcTop + 'px';
});
</script>

<template>
  <div class="app-content"><slot></slot></div>
</template>

<style lang="scss" scoped>
.app-content {
  padding-top: v-bind('pcPaddingTop');
  padding-bottom: var(--o-spacing-h1);
  padding-left: 44px;
  padding-right: 44px;
  max-width: 1504px;
  margin: 0 auto;
  @media (max-width: 1439px) {
    padding-left: 24px;
    padding-right: 24px;
  }
  @media (max-width: 1100px) {
    padding-left: 16px;
    padding-right: 16px;
    padding-top: v-bind('mobilePaddingTop');
    padding-bottom: var(--o-spacing-h2);
  }
}
</style>
