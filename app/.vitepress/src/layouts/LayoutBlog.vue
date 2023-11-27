<script setup lang="ts">
import { useData } from 'vitepress';
import { useI18n } from '@/i18n';
import AppMdHead from './AppMdHead.vue';
import BreadCrumbs from '@/components/BreadCrumbs.vue';

const { frontmatter, lang } = useData();
const i18n = useI18n();
const blogInfo = {
  link: `/${lang.value}/blogs/`,
  name: i18n.value.common.COMMON_CONFIG.BLOG,
};
</script>

<template>
  <div class="bread">
    <BreadCrumbs
      :bread1="blogInfo.name"
      :bread2="frontmatter.title"
      :link1="blogInfo.link"
    />
  </div>

  <div class="markdown">
    <AppMdHead :frontmatter="frontmatter" />
    <Content />
  </div>
</template>

<style lang="scss" scoped>
.markdown {
  margin-bottom: var(--o-spacing-h1);
  @media (max-width: 1100px) {
    margin-bottom: var(--o-spacing-h2);
  }
}

.bread {
  max-width: 1504px;
  padding: 40px 44px 0 44px;
  margin: 0 auto;
  @media (max-width: 1439px) {
    padding-left: 24px;
    padding-right: 24px;
  }
  @media (max-width: 1100px) {
    padding-left: 16px;
    padding-right: 16px;
  }
  @media (max-width: 768px) {
    padding-top: 16px;
  }
}
</style>
