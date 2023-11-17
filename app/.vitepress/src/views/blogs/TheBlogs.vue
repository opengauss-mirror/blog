<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useData } from 'vitepress';

import { useI18n } from '@/i18n';
import useWindowResize from '@/components/hooks/useWindowResize';

import AppContent from '@/components/AppContent.vue';
import AppPaginationMo from '@/components/AppPaginationMo.vue';
import BannerLevel2 from '@/components/BannerLevel2.vue';
import NotFound from '@/NotFound.vue';

import banner from '@/assets/illustrations/banner-secondary.png';
import illustration from '@/assets/illustrations/blog.png';

import IconCalendar from '~icons/app/icon-calendar.svg';
import IconUser from '~icons/app/icon-user.svg';
import IconRight from '~icons/app/icon-arrow-right.svg';
import IconSearch from '~icons/app/icon-search.svg';

import blogsAllData from '@/data/blogs';
import type { BlogItemT } from '@/shared/@types/type-blogs';

const router = useRouter();
const { lang } = useData();
const i18n = useI18n();
const userCaseData = computed(() => i18n.value.common.COMMON_CONFIG);
const screenWidth = useWindowResize();

const isMobile = computed(() => (screenWidth.value <= 768 ? true : false));

// pc端tag筛选
const selectData = computed(() => {
  let tempTag: any = [
    {
      title: '时间',
      select: [],
    },
    {
      title: '作者',
      select: [],
    },
    {
      title: '标签',
      select: [],
    },
  ];
  blogCardAllData.value.forEach((item: any) => {
    if (item.archives && !tempTag[0].select.includes(item.archives)) {
      tempTag[0].select.push(item.archives);
    }
    if (item.author && item.author.length) {
      item.author.forEach((itemAuthor: string) => {
        if (!tempTag[1].select.includes(itemAuthor)) {
          tempTag[1].select.push(itemAuthor);
        }
      });
    }
    if (item.tags && item.tags.length) {
      item.tags.forEach((itemTag: string) => {
        if (!tempTag[2].select.includes(itemTag)) {
          tempTag[2].select.push(itemTag);
        }
      });
    }
  });
  return tempTag;
});
const selectTimeVal = ref('');
const selectAuthorVal = ref('');
const selectTagsVal = ref('');

// 分页筛选
const blogsData = computed(() => {
  return lang.value === 'zh' ? blogsAllData.zh : blogsAllData.en;
});
const total = computed(() => {
  return blogCardAllData.value.length;
});
const pagesize = ref(9);
const currentPage = ref(1);
const pageTotal = computed(() => Math.ceil(total.value / pagesize.value));
const blogCardAllData = computed(() => {
  let temp1: any = [];
  let temp2: BlogItemT[] = [];
  let temp3: BlogItemT[] = [];
  if (!selectTimeVal.value && !selectAuthorVal.value && !selectTagsVal.value) {
    return blogsData.value;
  } else {
    if (selectTimeVal.value) {
      blogsData.value.forEach((item: any) => {
        if (item.archives === selectTimeVal.value) {
          temp1.push(item);
        }
      });
    } else {
      temp1 = blogsData.value;
    }
    if (selectAuthorVal.value) {
      temp1.forEach((item: BlogItemT) => {
        if (item.author?.includes(selectAuthorVal.value)) {
          temp2.push(item);
        }
      });
    } else {
      temp2 = temp1;
    }

    if (selectTagsVal.value) {
      temp2.forEach((item: BlogItemT) => {
        if (item.tags?.includes(selectTagsVal.value)) {
          temp3.push(item);
        }
      });
    } else {
      temp3 = temp2;
    }
    return temp3;
  }
});
const blogCardData = computed(() => {
  return blogCardAllData.value.slice(
    (currentPage.value - 1) * pagesize.value,
    currentPage.value * pagesize.value
  );
});

const toBlogContent = (path: string) => {
  router.go(`/${path}`);
};
const resetCurrentPage = () => {
  currentPage.value = 1;
};

const postBlog = () => {
  router.go(`/${lang.value}/blogs/guidance/`);
};

const changeCurrentMoblie = (val: string) => {
  if (val === 'prev' && currentPage.value > 1) {
    currentPage.value = currentPage.value - 1;
  } else if (val === 'next' && currentPage.value < pageTotal.value) {
    currentPage.value = currentPage.value + 1;
  }
};
</script>

<template>
  <BannerLevel2
    :background-image="banner"
    :title="userCaseData.BLOG"
    :illustration="illustration"
  >
    <template #default>
      <OButton
        class="post-btn"
        type="outline"
        animation
        size="nomral"
        @click="postBlog"
      >
        {{ userCaseData.STRATEGY }}
        <template #suffixIcon>
          <OIcon class="banner-icon"><IconRight /></OIcon>
        </template>
      </OButton>
    </template>
  </BannerLevel2>
  <AppContent :mobile-top="16">
    <template v-if="true">
      <div class="blog-select">
        <div class="blog-select-item">
          <span class="blog-select-item-title">{{ userCaseData.TIME }}</span>
          <ClientOnly>
            <OSelect
              v-model="selectTimeVal"
              filterable
              clearable
              :placeholder="userCaseData.ALL"
              @change="resetCurrentPage"
            >
              <template #prefix>
                <OIcon>
                  <IconSearch />
                </OIcon>
              </template>
              <OOption
                v-for="item in selectData[0].select"
                :key="item"
                :label="item"
                :value="item"
              />
            </OSelect>
          </ClientOnly>
        </div>
        <div class="blog-select-item">
          <span class="blog-select-item-title">{{ userCaseData.AUTHOR }}</span>
          <ClientOnly>
            <OSelect
              v-model="selectAuthorVal"
              filterable
              clearable
              :placeholder="userCaseData.ALL"
              @change="resetCurrentPage"
            >
              <template #prefix>
                <OIcon>
                  <IconSearch />
                </OIcon>
              </template>
              <OOption
                v-for="item in selectData[1].select"
                :key="item"
                :label="item"
                :value="item"
              />
            </OSelect>
          </ClientOnly>
        </div>
        <div class="blog-select-item">
          <span class="blog-select-item-title">{{ userCaseData.TAGS }}</span>
          <ClientOnly>
            <OSelect
              v-model="selectTagsVal"
              filterable
              clearable
              :placeholder="userCaseData.ALL"
              @change="resetCurrentPage"
            >
              <template #prefix>
                <OIcon>
                  <IconSearch />
                </OIcon>
              </template>
              <OOption
                v-for="item in selectData[2].select"
                :key="item"
                :label="item"
                :value="item"
              />
            </OSelect>
          </ClientOnly>
        </div>
      </div>
    </template>
    <template v-if="blogCardData.length">
      <div class="blog-list">
        <OCard
          v-for="item in blogCardData"
          :key="item"
          class="blog-list-item"
          shadow="hover"
          @click="toBlogContent(item.path)"
        >
          <p class="blog-list-item-title">{{ item.title }}</p>
          <div class="blog-list-item-info">
            <div class="infodetail">
              <OIcon class="icon"><IconUser /></OIcon>
              <p v-for="aut in item.author" :key="aut">
                {{ aut }}
              </p>
            </div>
            <div class="infodetail">
              <OIcon class="icon"><IconCalendar /></OIcon>
              <p>{{ item.date }}</p>
            </div>
          </div>
          <p class="blog-list-item-content">{{ item.summary }}</p>
          <div class="blog-list-item-tags">
            <OTag
              v-for="tag in item.tags"
              :key="tag"
              type="secondary"
              class="tag-item"
              >{{ tag }}</OTag
            >
          </div>
        </OCard>
      </div>
      <div class="blog-pagination">
        <ClientOnly>
          <OPagination
            v-if="!isMobile"
            v-model:currentPage="currentPage"
            v-model:page-size="pagesize"
            :background="true"
            layout="sizes, prev, pager, next, slot, jumper"
            :total="total"
            :page-sizes="[3, 6, 9]"
            @size-change="resetCurrentPage"
          >
            <span class="pagination-slot"
              >{{ currentPage }}/{{ pageTotal }}</span
            >
          </OPagination>
          <AppPaginationMo
            v-else
            :current-page="currentPage"
            :total-page="pageTotal"
            @turn-page="changeCurrentMoblie"
          />
        </ClientOnly>
      </div>
    </template>
    <NotFound v-else :no-data-tip="i18n.common.Not_Found" />
  </AppContent>
</template>

<style lang="scss" scoped>
@mixin showline {
  word-break: break-all;
  text-overflow: ellipsis;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
}
:deep(.el-card__body) {
  padding: var(--o-spacing-h2);
  @media (max-width: 1100px) {
    padding: var(--o-spacing-h4);
    height: 100%;
  }
  @media (max-width: 415px) {
    padding: var(--o-spacing-h6);
    min-height: 152px;
    max-height: 152px;
  }
}
.post-btn {
  color: var(--o-color-white);
  border-color: var(--o-color-white);
  @media (max-width: 767px) {
    padding: 3px 12px;
    font-size: var(--o-font-size-text);
    line-height: var(--o-line-height-text);
  }
  .banner-icon {
    @media (max-width: 767px) {
      font-size: var(--o-font-size-text);
    }
  }
}
.blog-select {
  display: flex;
  flex-direction: row;
  width: 1416px;
  @media (max-width: 1100px) {
    display: none;
  }
  .blog-select-item {
    margin-right: var(--o-spacing-h1);
    .o-icon {
      font-size: var(--o-font-size-h7);
      @media screen and (max-width: 768px) {
        font-size: var(--o-font-size-h8);
      }
    }
    .blog-select-item-title {
      margin-right: var(--o-spacing-h5);
      color: var(--o-color-text1);
      font-size: var(--o-font-size-h7);
      line-height: var(--o-line-height-h7);
    }
  }
}
.blog-list {
  margin: var(--o-spacing-h2) auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: var(--o-spacing-h4);
  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
    margin-top: var(--o-spacing-h5);
  }
  @media (max-width: 768px) {
    margin-top: 0;
    margin-bottom: var(--o-spacing-h5);
    grid-template-columns: repeat(1, 1fr);
    grid-gap: var(--o-spacing-h5);
  }
  .blog-list-item {
    background-image: url(@/assets/category/blogs/blog-bg.png);
    min-height: 248px;
    max-height: 248px;
    background-position: right bottom;
    background-repeat: no-repeat;
    background-size: cover;
    cursor: pointer;
    &:hover {
      box-shadow: var(--o-shadow-l2_hover);
    }
    @media (max-width: 415px) {
      min-height: 152px;
      max-height: 152px;
    }
    .blog-list-item-title {
      font-size: var(--o-font-size-h7);
      margin-bottom: var(--o-spacing-h3);
      color: var(--o-color-text1);
      height: 46px;
      @include showline();
      -webkit-line-clamp: 2;
      @media (max-width: 768px) {
        height: auto;
      }
      @media (max-width: 415px) {
        margin-bottom: var(--o-spacing-h5);
        font-size: var(--o-font-size-text);
        line-height: var(--o-line-height-text);
        font-weight: 500;
        -webkit-line-clamp: 1;
      }
      p {
        display: inline-block;
        @include showline();
        -webkit-line-clamp: 2;
      }
    }
    .blog-list-item-info {
      color: var(--o-color-text4);
      display: flex;
      flex-direction: row;
      align-items: center;
      .icon {
        font-size: var(--o-font-size-h8);
        display: inline-block;
      }
      p {
        font-size: var(--o-font-size-tip);
        display: inline-block;
        margin-left: var(--o-spacing-h9);
        line-height: var(--o-line-height-tip);
        @include showline();
        -webkit-line-clamp: 1;
      }
      .infodetail {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-right: var(--o-spacing-h3);
      }
    }
    .blog-list-item-content {
      font-size: var(--o-font-size-text);
      line-height: var(--o-line-height-text);
      margin-top: var(--o-spacing-h5);
      height: 44px;
      color: var(--o-color-text1);
      @include showline();
      -webkit-line-clamp: 2;
      @media (max-width: 415px) {
        font-size: var(--o-font-size-tip);
        line-height: var(--o-line-height-tip);
        height: auto;
        @include showline();
        -webkit-line-clamp: 1;
      }
    }
    .blog-list-item-tags {
      display: flex;
      margin-top: var(--o-spacing-h7);
      height: 24px;
      flex-wrap: wrap;
      overflow: hidden;
      @media (max-width: 415px) {
        margin-top: var(--o-spacing-h5);
      }
      .tag-item {
        font-size: var(--o-spacing-h6);
        margin-right: var(--o-spacing-h8);
        color: var(--o-color-black);
        margin-bottom: var(--o-spacing-h10);
        @media (max-width: 415px) {
          font-size: var(--o-font-size-tip);
          line-height: var(--o-line-height-tip);
        }
      }
    }
  }
}
.pagination-slot {
  font-size: var(--o-font-size-text);
  font-weight: 300;
  color: var(--o-color-text1);
  line-height: var(--o-spacing-h4);
}
</style>
