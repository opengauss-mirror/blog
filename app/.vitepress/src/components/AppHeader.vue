<script setup lang="ts">
import logo_light from '@/assets/logo.svg';
</script>

<template>
  <header class="app-header">
    <div class="app-header-body">
      <img class="logo" alt="openEuler logo" :src="logo_light" />
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  background-color: var(--o-color-bg2);
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 99;
  box-shadow: var(--o-shadow-l1);
  &-body {
    display: flex;
    align-items: center;
    max-width: 1504px;
    padding: 0 44px;
    margin: 0 auto;
    height: 80px;
    @media (max-width: 1439px) {
      padding: 0 24px;
    }
    @media (max-width: 1100px) {
      padding: 0 16px;
      height: 48px;
      justify-content: space-between;
      position: relative;
    }
  }
}
.logo {
  height: 32px;
  cursor: pointer;
  margin-right: var(--o-spacing-h4);
  @media (max-width: 1100px) {
    height: 24px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 12px;
    margin-right: 0;
  }
}
</style>
