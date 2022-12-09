<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import { useRouter, useData } from 'vitepress';

import { useI18n } from '@/i18n';
import useWindowResize from '@/components/hooks/useWindowResize';

import AppContent from '@/components/AppContent.vue';
import AppPaginationMo from '@/components/AppPaginationMo.vue';
import BannerLevel2 from '@/components/BannerLevel2.vue';
import NotFound from '@/NotFound.vue';
// import MobileFilter from '@/components/MobileFilter.vue';

import banner from '@/assets/banner/banner-interaction.png';
import blogIllustration from '@/assets/illustrations/blog.png';
import IconCalendar from '~icons/app/icon-calendar.svg';
import IconUser from '~icons/app/icon-user.svg';
// import IconBrowse from '~icons/app/icon-browse.svg';
import IconRight from '~icons/app/icon-arrow-right.svg';
import IconSearch from '~icons/app/icon-search.svg';

import { getSortData, getTagsData } from '@/api/api-search';

interface BlogData {
  archives: string;
  articleName: string;
  author: any;
  category: string;
  date: string;
  deleteType: string;
  lang: string;
  path: string;
  summary: string;
  tags: string[];
  textContent: string;
  title: string;
  type: string;
}

interface ParamsType {
  page: number;
  pageSize: number;
  lang: string;
  category: string;
  archives?: string;
  author?: string;
  tags?: string;
}

const router = useRouter();
const { lang } = useData();
const i18n = useI18n();
const userCaseData = computed(() => i18n.value.interaction);
const screenWidth = useWindowResize();

const isMobile = computed(() => (screenWidth.value <= 768 ? true : false));

const isShowData = ref(false);
// 博客列表
const sortParams = reactive({
  page: 1,
  pageSize: 9,
  lang: lang.value,
  category: 'blog',
});
// 标签
const tagsParams = reactive({
  lang: lang.value,
  category: 'blog',
  want: '',
});
// 移动端数据
// const tagsDataToChild = ref<any>([
//   {
//     title: '时间',
//     select: [],
//   },
//   {
//     title: '作者',
//     select: [],
//   },
// ]);
// pc端筛选数据
const selectData = ref<any>([
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
]);
const selectTimeVal = ref('');
const selectAuthorVal = ref('');
const selectTagsVal = ref('');

// 博客列表数据
const blogCardData = ref<BlogData[]>([]);
// 分页数据
const paginationData = ref({
  total: 0,
  pagesize: 9,
  currentpage: 0,
});

const toBlogContent = (path: string) => {
  const path1 = router.route.path.substring(0, 3);
  router.go(`${path1}/${path}`);
};
// 获取标签数据
const getTagsList = () => {
  tagsParams.want = 'archives';
  getTagsData(tagsParams).then((res) => {
    selectData.value[0].select = [];
    res.obj.totalNum.forEach((item: any) => {
      selectData.value[0].select.push(item.key);
    });
    tagsParams.want = 'author';
    getTagsData(tagsParams)
      .then((res) => {
        selectData.value[1].select = [];
        res.obj.totalNum.forEach((item: any) => {
          selectData.value[1].select.push(item.key);
        });
        tagsParams.want = 'tags';
        getTagsData(tagsParams).then((res) => {
          selectData.value[2].select = [];
          res.obj.totalNum.forEach((item: any) => {
            selectData.value[2].select.push(item.key);
          });
        });
      })
      .catch((error: any) => {
        isShowData.value = false;
        throw new Error(error);
      });
  });
};
// 获取列表数据
const getListData = (params: ParamsType) => {
  getSortData(params)
    .then((res) => {
      if (res.obj.count === 0) {
        isShowData.value = false;
      } else {
        paginationData.value.total = res.obj.count;
        paginationData.value.currentpage = res.obj.page;
        paginationData.value.pagesize = res.obj.pageSize;
        blogCardData.value = res.obj.records;
        for (let i = 0; i < blogCardData.value.length; i++) {
          if (typeof blogCardData.value[i].author === 'string') {
            blogCardData.value[i].author = [blogCardData.value[i].author];
          }
          blogCardData.value[i].archives = blogCardData.value[
            i
          ].archives.substring(0, 7);
        }
        isShowData.value = true;
      }
    })
    .catch((error: any) => {
      isShowData.value = false;
      throw new Error(error);
    });
};

// 筛选方法
// const listFilter = (val: any) => {
//   let paramsdate = '';
//   let paramsauthor = '';
//   for (let i = 0; i < val.length; i++) {
//     if (val[i].title === '时间') {
//       paramsdate = val[i].sele[0];
//     }
//     if (val[i].title === '作者') {
//       paramsauthor = val[i].sele[0];
//     }
//   }
//   const params = {
//     page: 1,
//     pageSize: 9,
//     lang: lang.value,
//     category: 'blog',
//     archives: paramsdate,
//     author: paramsauthor,
//   };
//   getListData(params);
// };
// pc筛选
const selectMethod = () => {
  const params = {
    page: 1,
    pageSize: 9,
    lang: lang.value,
    category: 'blog',
    archives: selectTimeVal.value === '' ? undefined : selectTimeVal.value,
    author: selectAuthorVal.value === '' ? undefined : selectAuthorVal.value,
    tags: selectTagsVal.value === '' ? undefined : selectTagsVal.value,
  };
  getListData(params);
};

const timeChange = () => {
  selectMethod();
  if (selectTimeVal.value !== '') {
    const wantauthor = {
      lang: lang.value,
      category: 'blog',
      want: 'author',
      condition: {
        archives: selectTimeVal.value,
        tags: selectTagsVal.value === '' ? undefined : selectTagsVal.value,
      },
    };
    const wanttags = {
      lang: lang.value,
      category: 'blog',
      want: 'tags',
      condition: {
        archives: selectTimeVal.value,
        author:
          selectAuthorVal.value === '' ? undefined : selectAuthorVal.value,
      },
    };
    getTagsData(wantauthor).then((res) => {
      selectData.value[1].select = [];
      res.obj.totalNum.forEach((item: any) => {
        selectData.value[1].select.push(item.key);
      });
      getTagsData(wanttags)
        .then((res) => {
          selectData.value[2].select = [];
          res.obj.totalNum.forEach((item: any) => {
            selectData.value[2].select.push(item.key);
          });
        })
        .catch((error) => {
          throw new Error(error);
        });
    });
  } else if (
    selectTimeVal.value === '' &&
    selectAuthorVal.value === '' &&
    selectTagsVal.value === ''
  ) {
    getTagsList();
  } else {
    const params = {
      lang: lang.value,
      category: 'blog',
      want: 'archives',
      condition: {
        author:
          selectAuthorVal.value === '' ? undefined : selectAuthorVal.value,
        tags: selectTagsVal.value === '' ? undefined : selectTagsVal.value,
      },
    };
    getTagsData(params).then((res) => {
      selectData.value[0].select = [];
      res.obj.totalNum.forEach((item: any) => {
        selectData.value[0].select.push(item.key);
      });
    });
  }
};
const authorChange = () => {
  selectMethod();
  if (selectAuthorVal.value !== '') {
    const wantarchive = {
      lang: lang.value,
      category: 'blog',
      want: 'archives',
      condition: {
        author: selectAuthorVal.value,
        tags: selectTagsVal.value === '' ? undefined : selectTagsVal.value,
      },
    };
    const wanttags = {
      lang: lang.value,
      category: 'blog',
      want: 'tags',
      condition: {
        archives: selectTimeVal.value === '' ? undefined : selectTimeVal.value,
        author: selectAuthorVal.value,
      },
    };
    getTagsData(wantarchive).then((res) => {
      selectData.value[0].select = [];
      res.obj.totalNum.forEach((item: any) => {
        selectData.value[0].select.push(item.key);
      });
      getTagsData(wanttags)
        .then((res) => {
          selectData.value[2].select = [];
          res.obj.totalNum.forEach((item: any) => {
            selectData.value[2].select.push(item.key);
          });
        })
        .catch((error) => {
          throw new Error(error);
        });
    });
  } else if (
    selectTimeVal.value === '' &&
    selectAuthorVal.value === '' &&
    selectTagsVal.value === ''
  ) {
    getTagsList();
  } else {
    const params = {
      lang: lang.value,
      category: 'blog',
      want: 'author',
      condition: {
        archives: selectTimeVal.value === '' ? undefined : selectTimeVal.value,
        tags: selectTagsVal.value === '' ? undefined : selectTagsVal.value,
      },
    };
    getTagsData(params).then((res) => {
      selectData.value[1].select = [];
      res.obj.totalNum.forEach((item: any) => {
        selectData.value[1].select.push(item.key);
      });
    });
  }
};
const tagsChange = () => {
  selectMethod();
  if (selectTagsVal.value !== '') {
    const wantarchive = {
      lang: lang.value,
      category: 'blog',
      want: 'archives',
      condition: {
        author:
          selectAuthorVal.value === '' ? undefined : selectAuthorVal.value,
        tags: selectTagsVal.value,
      },
    };
    const wantauthor = {
      lang: lang.value,
      category: 'blog',
      want: 'author',
      condition: {
        archives: selectTimeVal.value === '' ? undefined : selectTimeVal.value,
        tags: selectTagsVal.value,
      },
    };
    getTagsData(wantarchive).then((res) => {
      selectData.value[0].select = [];
      res.obj.totalNum.forEach((item: any) => {
        selectData.value[0].select.push(item.key);
      });
      getTagsData(wantauthor)
        .then((res) => {
          selectData.value[1].select = [];
          res.obj.totalNum.forEach((item: any) => {
            selectData.value[1].select.push(item.key);
          });
        })
        .catch((error) => {
          throw new Error(error);
        });
    });
  } else if (
    selectTimeVal.value === '' &&
    selectAuthorVal.value === '' &&
    selectTagsVal.value === ''
  ) {
    getTagsList();
  } else {
    const params = {
      lang: lang.value,
      category: 'blog',
      want: 'tags',
      condition: {
        author:
          selectAuthorVal.value === '' ? undefined : selectAuthorVal.value,
        archives: selectTimeVal.value === '' ? undefined : selectTimeVal.value,
      },
    };
    getTagsData(params).then((res) => {
      selectData.value[2].select = [];
      res.obj.totalNum.forEach((item: any) => {
        selectData.value[2].select.push(item.key);
      });
    });
  }
};

onMounted(() => {
  getListData(sortParams);
  getTagsList();
});
// 页数改变
const currentChange = (val: number) => {
  const params: ParamsType = {
    category: 'blog',
    lang: lang.value,
    page: val,
    pageSize: paginationData.value.pagesize,
  };
  selectAuthorVal.value ? (params['author'] = selectAuthorVal.value) : '';
  selectTagsVal.value ? (params['tags'] = selectTagsVal.value) : '';
  selectTimeVal.value ? (params['archives'] = selectTimeVal.value) : '';
  getListData(params);
};

const postBlog = () => {
  router.go(`/${lang.value}/interaction/post-blog/`);
};
// 计算总页数
const pageTotal = computed(() =>
  Math.ceil(paginationData.value.total / paginationData.value.pagesize)
);
const moblieCurrentChange = (val: string) => {
  if (val === 'prev' && paginationData.value.currentpage > 1) {
    paginationData.value.currentpage = paginationData.value.currentpage - 1;
    currentChange(paginationData.value.currentpage);
  } else if (
    val === 'next' &&
    paginationData.value.currentpage < pageTotal.value
  ) {
    paginationData.value.currentpage = paginationData.value.currentpage + 1;
    currentChange(paginationData.value.currentpage);
  }
};
</script>

<template>
  <BannerLevel2
    :background-image="banner"
    background-text="INTERACTION"
    :title="userCaseData.BLOG"
    :illustration="blogIllustration"
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
          <OIcon class="bannericon"><IconRight /></OIcon>
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
              @change="timeChange"
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
              @change="authorChange"
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
              @change="tagsChange"
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
      <!-- <div class="blog-tag2">
        <MobileFilter
          :data="tagsDataToChild"
          :single="true"
          @filter="listFilter"
        />
      </div> -->
    </template>
    <template v-if="isShowData">
      <div class="blog-list">
        <OCard
          v-for="item in blogCardData"
          :key="item"
          shadow="hover"
          class="blog-list-item"
          @click="toBlogContent(item.path)"
        >
          <div class="blog-list-item-title">
            <p>{{ item.title }}</p>
          </div>
          <div class="blog-list-body">
            <div class="blog-list-item-info">
              <div class="infodetail">
                <OIcon class="icon"><IconUser /></OIcon>
                <p v-for="(aut, index2) in item.author" :key="aut">
                  {{ aut
                  }}<span v-show="item.author.length !== index2 + 1">,</span>
                </p>
              </div>
              <div class="infodetail">
                <OIcon class="icon"><IconCalendar /></OIcon>
                <p>
                  {{ item.archives }}
                </p>
              </div>
              <!-- <div class="infodetail">
              <OIcon class="icon"><IconBrowse /></OIcon>
              <p>{{userCaseData.BROWSE}}{{ item.browsetimes }}{{userCaseData.TIMES}}</p>
              <p>{{ userCaseData.BROWSE }}10{{ userCaseData.TIMES }}</p>
            </div> -->
            </div>
            <div class="blog-list-item-content">
              <p>{{ item.summary }}</p>
            </div>
          </div>
          <div class="blog-list-item-tags">
            <OTag
              v-for="tag in item.tags"
              :key="tag"
              type="secondary"
              class="tagitem"
              >{{ tag }}</OTag
            >
          </div>
        </OCard>
      </div>
      <div class="blog-pagination">
        <ClientOnly>
          <OPagination
            v-if="!isMobile"
            v-model:currentPage="paginationData.currentpage"
            v-model:page-size="paginationData.pagesize"
            :background="true"
            layout="sizes, prev, pager, next, slot, jumper"
            :total="paginationData.total"
            :page-sizes="[3, 6, 9]"
            @current-change="currentChange"
            @size-change="currentChange(1)"
          >
            <span class="pagination-slot"
              >{{ paginationData.currentpage }}/{{ pageTotal }}</span
            >
          </OPagination>
        </ClientOnly>
        <AppPaginationMo
          :current-page="paginationData.currentpage"
          :total-page="pageTotal"
          @turn-page="moblieCurrentChange"
        >
        </AppPaginationMo>
      </div>
    </template>
    <NotFound v-else />
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: var(--o-spacing-h2);
}

.bannericon {
  color: var(--o-color-brand2);
  @media (max-width: 767px) {
    font-size: var(--o-font-size-text);
  }
}

.post-btn {
  color: var(--o-color-white);
  border-color: var(--o-color-white);
  @media (max-width: 767px) {
    padding: 3px 16px;
    font-size: var(--o-font-size-text);
    line-height: var(--o-line-height-text);
  }
}

.pagination-slot {
  font-size: var(--o-font-size-text);
  font-weight: 400;
  color: var(--o-color-text1);
  line-height: var(--o-spacing-h4);
}

.blog {
  &-tag2 {
    display: none;
  }
  &-select {
    display: flex;
    flex-direction: row;
    width: 1416px;
    &-item {
      margin-right: var(--o-spacing-h1);
      .o-icon {
        font-size: var(--o-font-size-h7);
        @media screen and (max-width: 768px) {
          font-size: var(--o-font-size-h8);
        }
      }
      &-title {
        margin-right: var(--o-spacing-h5);
        color: var(--o-color-text1);
        font-size: var(--o-font-size-h7);
        line-height: var(--o-line-height-h7);
      }
    }
  }
  &-list {
    margin: var(--o-spacing-h2) auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: var(--o-spacing-h4);
    &-item {
      background-image: url(@/assets/interaction/bg.png);
      min-height: 248px;
      max-height: 248px;
      background-position: right bottom;
      background-repeat: no-repeat;
      cursor: pointer;
      &-title {
        flex: 1;
        font-size: var(--o-font-size-h7);
        color: var(--o-color-text1);

        p {
          display: inline-block;
          @include showline();
          -webkit-line-clamp: 2;
        }
      }
      &-info {
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
      &-content {
        font-size: var(--o-font-size-text);
        line-height: var(--o-line-height-text);
        margin-top: var(--o-spacing-h5);
        height: 44px;
        color: var(--o-color-text1);
        @include showline();
        -webkit-line-clamp: 2;
      }
      &-tags {
        display: flex;
        margin-top: var(--o-spacing-h7);
        height: 24px;
        flex-wrap: wrap;
        overflow: hidden;
        .tagitem {
          font-size: var(--o-spacing-h6);
          margin-right: var(--o-spacing-h8);
          color: var(--o-color-black);
          margin-bottom: var(--o-spacing-h10);
        }
      }
    }
  }
}
@media (max-width: 1100px) {
  .blog-list {
    grid-template-columns: repeat(2, 1fr);
    margin-top: var(--o-spacing-h5);
  }
  .blog-tag2 {
    display: block;
    margin-left: var(--o-spacing-h5);
  }
  .blog-select {
    display: none;
  }
  :deep(.el-card__body) {
    padding: var(--o-spacing-h3);
    height: 100%;
  }
}
@media (max-width: 768px) {
  .blog-list {
    margin-top: 0;
    margin-bottom: var(--o-spacing-h5);
    grid-template-columns: repeat(1, 1fr);
    grid-gap: var(--o-spacing-h5);
  }
}
@media (max-width: 415px) {
  :deep(.el-card__body) {
    padding: var(--o-spacing-h6);
    min-height: 152px;
    max-height: 152px;
  }
  .blog-list-item {
    min-height: 152px;
    max-height: 152px;
  }

  .blog-list-item-content {
    font-size: var(--o-font-size-tip);
    line-height: var(--o-line-height-tip);
    height: auto;
    @include showline();
    -webkit-line-clamp: 1;
  }
  .blog-list-item-title {
    margin-bottom: var(--o-spacing-h5);
    font-size: var(--o-font-size-text);
    line-height: var(--o-line-height-text);
    font-weight: 500;
    p {
      @include showline();
      -webkit-line-clamp: 1;
    }
  }
  .tagitem {
    font-size: var(--o-font-size-tip);
    line-height: var(--o-line-height-tip);
  }
  .blog-list-item-tags {
    margin-top: var(--o-spacing-h5);
  }
}
@media (max-width: 500px) {
  .blog-select {
    display: none;
  }
}
</style>
