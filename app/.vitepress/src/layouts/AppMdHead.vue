<script lang="ts" setup>
import dayjs from 'dayjs';
defineProps({
  frontmatter: {
    type: Object || String,
    default() {
      return {};
    },
  },
});
// 格式化日期
const resolveDate = (date: any) => {
  return dayjs(date).format('YYYY-MM-DD');
};
</script>

<template>
  <div class="markdown-body-title">
    <h2 class="page-title">{{ frontmatter.title }}</h2>
    <div v-if="frontmatter.author" class="info">
      <template v-if="Array.isArray(frontmatter.author)">
        <span v-for="item in frontmatter.author" :key="item" class="author">
          {{ item }}
        </span>
      </template>
      <span v-else class="author">{{ frontmatter.author }} </span>
      <span v-if="frontmatter.date" class="date">
        {{ resolveDate(frontmatter.date) }}
      </span>
      <template v-if="frontmatter.tags">
        <span v-for="item in frontmatter.tags" :key="item" class="">
          {{ item }}
        </span>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.markdown-body-title {
  margin-bottom: 40px;
  border-bottom: 1px solid var(--o-color-border2);
  padding-bottom: 24px;
  .page-title {
    font-size: 36px;
    line-height: 48px;
    margin: 0;
    font-weight: 500;
  }
  .info {
    color: var(--o-color-text4);
    font-size: var(--o-font-size-tip);
    line-height: var(--o-line-height-tip);
    .line {
      margin: 0 16px;
    }
    .author {
      display: inline-block;
      margin-left: 0;
      margin-top: 20px;
      @media screen and (max-width: 1280px) {
        margin-top: 8px;
      }

      &:not(:first-child)::before {
        content: ',';
        padding-left: 4px;
      }
    }
    .date {
      display: inline-block;
      margin: 0 12px;
      padding: 0 12px;
      margin-top: 8px;
      border-left: 1px solid var(--o-color-border1);
      border-right: 1px solid var(--o-color-border1);
    }
    .o-tag {
      margin-top: 8px;
      margin-right: 4px;
    }
  }
}
@media (max-width: 1100px) {
  .markdown-body-title {
    margin-bottom: 16px;
    padding-bottom: 16px;
    .page-title {
      font-size: 16px;
      line-height: 24px;
    }
  }
}
</style>
