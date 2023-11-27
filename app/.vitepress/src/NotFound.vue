<script setup lang="ts">
import notFoundImg_light from '@/assets/illustrations/404.png';
defineProps({
  noDataTip: {
    type: String,
    default: '404 Not Found',
  },
});
</script>

<template>
  <div class="nofound">
    <img class="nofound-img" :src="notFoundImg_light" alt="404" />
    <p class="nofound-text">{{ noDataTip }}</p>
  </div>
</template>

<style lang="scss" scoped>
.nofound {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  font-size: var(--o-font-size-h6);
  color: var(--o-color-text1);
  padding: var(--o-spacing-h2) 0;
  min-height: calc(100vh - 329px);
  .nofound-text {
    margin-top: var(--o-spacing-h5);
    font-size: var(--o-font-size-h7);
  }
  .nofound-img {
    height: 300px;
  }
  @media screen and (max-width: 768px) {
    padding-top: var(--o-spacing-h2);
    font-size: var(--o-font-size-text);
    .nofound-img {
      max-height: 232px;
    }
    .nofound-text {
      margin-top: var(--o-spacing-h6);
      font-size: var(--o-font-size-tip);
    }
  }
}
</style>
