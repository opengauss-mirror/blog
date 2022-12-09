<script setup lang="ts">
import { useData, useRouter } from 'vitepress';
import { useI18n } from '@/i18n';
import AppMdHead from './AppMdHead.vue';
import BreadCrumbs from '@/components/BreadCrumbs.vue';

const { frontmatter, lang } = useData();
const i18n = useI18n();

const newsInfo = {
  link: `/${lang.value}/interaction/news-list/`,
  name: i18n.value.common.NAV_ROUTER.NEWS,
};

const router = useRouter();
</script>

<template>
  <div class="bread">
    <BreadCrumbs
      :bread1="newsInfo.name"
      :bread2="frontmatter.title"
      :link1="newsInfo.link"
    />
  </div>
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
.bread {
  padding-top: 40px;
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
  }
  @media (max-width: 768px) {
    padding-top: 16px;
  }
}
</style>
