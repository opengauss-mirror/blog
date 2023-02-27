<script setup lang="ts">
import { useData } from 'vitepress';
import AppMdHead from './AppMdHead.vue';

const { frontmatter } = useData();
</script>

<template>
  <div class="markdown">
    <div class="news-markdown-detail">
      <AppMdHead :frontmatter="frontmatter" />
      <Content />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.news-markdown-detail {
  margin: 0 auto;
}
</style>
