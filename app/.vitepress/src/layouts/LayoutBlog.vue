<script setup lang="ts">
import { useData } from 'vitepress';
import { useI18n } from '@/i18n';
import AppMdHead from './AppMdHead.vue';
import BreadCrumbs from '@/components/BreadCrumbs.vue';

const { frontmatter, lang } = useData();
const i18n = useI18n();
const blogInfo = {
  link: `/${lang.value}/interaction/blog-list/`,
  name: i18n.value.common.NAV_ROUTER.BLOG,
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
    <hr />
    <div class="copyright">
      {{ i18n.interaction.COPYRIGHT_1 }}
      <a
        target="_blank"
        href="https://creativecommons.org/licenses/by-sa/4.0/legalcode"
        >CC-BY-SA 4.0</a
      >
      {{ i18n.interaction.COPYRIGHT_2 }}
    </div>
    <div class="disclaimer">
      {{ i18n.interaction.DISCLAIMER }}
    </div>
  </div>
</template>

<style lang="scss" scoped>
:deep(.markdown-body-title) {
  .page-title {
    font-weight: 300;
  }
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
.disclaimer,
.copyright {
  font-size: var(--o-font-size-h8);
  line-height: var(--o-line-height-h8);
  color: var(--o-color-brand1);
  a {
    text-decoration: underline;
  }
  @media screen and (max-width: 768px) {
    font-size: var(--o-font-size-text);
    line-height: var(--o-line-height-text);
  }
}
.disclaimer {
  margin-top: var(--o-spacing-h6);
  @media screen and (max-width: 768px) {
    margin-top: var(--o-spacing-h8);
  }
}
</style>
