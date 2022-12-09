<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useI18n } from '@/i18n';

import BannerLevel2 from '@/components/BannerLevel2.vue';

import banner from '@/assets/banner/banner-download.png';
import illustration from '@/assets/illustrations/brand.png';

const i18n = useI18n();

const list: Ref<any[]> = ref([]);

const initList = () => {
  const result = [];
  const cndata = i18n.value.brand;
  const nameList = [
    'VERTICAL_LEFT_IMAGE',
    'VERTICAL_CENTER_IMAGE',
    'VERTICAL_RIGHT_IMAGE',
    'HORIZONTAL_LEFT_IMAGE',
    'HORIZONTAL_CENTER_IMAGE',
    'HORIZONTAL_RIGHT_IMAGE',
  ];
  const imageList = [
    '/img/other/brand/standard-poster.png',
    '/img/other/brand/mono-poster.png',
    '/img/other/brand/black-poster.png',
    '/img/other/brand/horizontal-poster.png',
    '/img/other/brand/white-poster.png',
    '/img/other/brand/block-hor-poster.png',
  ];

  const imageListMobile = [
    '/img/other/brand/brand-mobile-1.png',
    '/img/other/brand/brand-mobile-2.png',
    '/img/other/brand/brand-mobile-3.png',
    '/img/other/brand/brand-mobile-4.png',
    '/img/other/brand/brand-mobile-5.png',
    '/img/other/brand/brand-mobile-6.png',
  ];

  for (let i = 0; i < imageList.length; i++) {
    const temp = {
      id: i,
      name: cndata.PICTURE_TITLE[i],
      url: imageList[i],
      image: cndata[nameList[i]],
      mobile: imageListMobile[i],
    };
    result.push(temp);
  }
  return result;
};

list.value = initList();
</script>

<template>
  <BannerLevel2
    :background-image="banner"
    background-text="CONTENT"
    :title="i18n.brand.BRAND"
    :illustration="illustration"
  />
  <div class="brand">
    <div class="brand-all-word">
      <h3 class="brand-title">{{ i18n.brand.MOBILETITLE }}</h3>
      <div class="brand-word">
        {{ i18n.brand.WORDS[0] }}
        <a :href="i18n.brand.WORDS_LINK[0]" target="_blank">{{
          i18n.brand.WORDS[1]
        }}</a>
        {{ i18n.brand.WORDS[2] }}
        <br />
        {{ i18n.brand.WORDS[3] }}
        <a :href="i18n.brand.WORDS_LINK[1]">{{ i18n.brand.WORDS[4] }}</a>
        {{ i18n.brand.WORDS[5] }}
        <a :href="i18n.brand.WORDS_LINK[2]" download>{{
          i18n.brand.WORDS[6]
        }}</a>
        <br />
        {{ i18n.brand.WORDS[7] }}
        <a :href="i18n.brand.WORDS_LINK[3]" download>{{
          i18n.brand.WORDS[8]
        }}</a>
      </div>
    </div>
    <div class="brand-list">
      <OCard
        v-for="item in list"
        :key="item.id"
        class="brand-item"
        shadow="hover"
      >
        <div class="brand-item-title">{{ item.name }}</div>
        <div class="brand-item-img">
          <img :src="item.mobile" />
        </div>
        <div class="button-group">
          <a
            v-for="item2 in item.image"
            :key="item2.STYLE"
            :href="item2.URL"
            target="_blank"
            download
          >
            <OButton size="mini" class="button-item"
              >{{ item2.STYLE }}
            </OButton>
          </a>
        </div>
      </OCard>
    </div>
    <div class="brand-other-word">
      <h3 class="brand-title">{{ i18n.brand.PROJECT_TITLE }}</h3>
    </div>
    <div class="brand-list">
      <OCard
        v-for="item in i18n.brand.PROJECT_LIST"
        :key="item.TITLE"
        shadow="hover"
        class="brand-item"
      >
        <div class="brand-item-title">{{ item.TITLE }}</div>
        <div class="brand-item-img">
          <img
            :src="item.URL"
            :style="{
              maxWidth: item.width + 'px',
              maxHeight: item.height + 'px',
            }"
          />
        </div>
        <div class="button-group">
          <a
            v-for="item2 in item.DOWNLOAD_LINK"
            :key="item2.STYLE"
            :href="item2.URL"
            target="_blank"
            download
          >
            <OButton size="mini" class="button-item"
              >{{ item2.STYLE }}
            </OButton>
          </a>
        </div>
      </OCard>
    </div>

    <div class="brand-ppt">
      <h3>{{ i18n.brand.PPT_TEXT }}</h3>
      <div class="ppt-list">
        <OCard
          v-for="(ppt, index) in i18n.brand.PPT_LIST"
          :key="ppt.LINK"
          shadow="hover"
          class="ppt-item"
          :style="{ padding: '0px' }"
        >
          <a :href="ppt.LINK" target="_blank" download>
            <img :src="ppt.URL" alt="" />
            <div class="ppt-word">
              {{ i18n.brand.PPT_TEMPLATES[index] }}
            </div>
          </a>
        </OCard>
      </div>
    </div>
    <div class="brand-other-word">
      <div class="brand-faq">
        {{ i18n.brand.WORDS_FAQ[0] }}
        <a :href="i18n.brand.FAQ_LINK">{{ i18n.brand.WORDS_FAQ[1] }}</a>
        {{ i18n.brand.WORDS_FAQ[2] }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.button-group {
  display: grid;
  width: 100%;
  margin-top: var(--o-spacing-h5);
  justify-items: center;
  align-items: center;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: var(--o-spacing-h8);
  a {
    width: 100%;
    display: flex;
    flex-flow: row;
    justify-content: center;
    align-items: center;
  }

  .button-item {
    // padding: var(--o-spacing-h10) 0;
    max-width: 70px;
    // width: 100%;
    // font-size: var(--o-font-size-text);
    // font-weight: 400;
    // line-height: var(--o-line-height-text);
    // display: flex;
    // flex-flow: row;
    // justify-content: center;
    // align-items: center;
    @media (max-width: 768px) {
      max-width: 80px;
    }
  }
  .button-item:hover {
    background-color: var(--o-color-brand1);
    color: var(--o-color-text2);
  }
}
.brand {
  margin: var(--o-spacing-h1) auto;
  padding: 0 var(--o-spacing-h2);
  max-width: 1504px;
  @media (max-width: 1100px) {
    padding: 0 var(--o-spacing-h5);
    margin: var(--o-spacing-h2) auto;
  }
  &-title {
    font-size: var(--o-font-size-h3);
    font-weight: 300;
    color: var(--o-color-text1);
    line-height: var(--o-line-height-h3);
    width: 100%;
    text-align: center;
    @media (max-width: 768px) {
      font-size: var(--o-font-size-h8);
      line-height: var(--o-line-height-h8);
    }
  }

  &-faq {
    font-size: var(--o-font-size-h7);
    font-weight: 500;
    color: var(--o-color-text1);
    line-height: var(--o-line-height-h7);
    margin-top: var(--o-spacing-h10);
    a {
      color: var(--o-color-brand1);
    }
    @media (max-width: 768px) {
      font-size: var(--o-font-size-tip);
      line-height: var(--o-line-height-tip);
      margin-top: var(--o-spacing-h5);
    }
  }

  &-other-word {
    margin-top: var(--o-spacing-h2);
  }

  &-word {
    font-size: var(--o-font-size-h7);
    font-weight: 300;
    color: var(--o-color-text1);
    line-height: var(--o-line-height-h7);
    margin-top: var(--o-spacing-h10);
    a {
      color: var(--o-color-brand1);
    }
    @media (max-width: 768px) {
      font-size: var(--o-font-size-tip);
      line-height: var(--o-line-height-tip);
      margin-top: var(--o-spacing-h5);
    }
  }

  &-list {
    display: grid;
    width: 100%;
    margin-top: var(--o-spacing-h2);
    justify-items: center;
    align-items: center;
    grid-template-columns: repeat(4, 1fr);
    grid-gap: var(--o-spacing-h4);
  }

  &-item {
    width: 100%;
    padding: 0;
    @media (max-width: 768px) {
    }
    :deep(.el-card__body) {
      padding: var(--o-spacing-h4);
      @media (max-width: 768px) {
        padding: var(--o-spacing-h5) var(--o-spacing-h6);
      }
    }

    &-title {
      font-size: var(--o-font-size-h7);
      font-weight: 400;
      color: var(--o-color-text1);
      line-height: var(--o-line-height-h7);
      margin-top: var(--o-spacing-h10);
      @media (max-width: 768px) {
        font-size: var(--o-font-size-text);
        line-height: var(--o-line-height-text);
      }
    }
    &-img {
      height: 120px;
      width: 100%;
      margin-top: var(--o-spacing-h5);
      display: flex;
      align-items: center;
      justify-content: center;
      img {
        object-fit: contain;
        max-width: 220px;
        width: 100%;
        height: 100%;
        @media (max-width: 768px) {
          max-width: 240px;
        }
      }
      @media (max-width: 768px) {
        height: 80px;
      }
    }
  }

  &-ppt {
    margin-top: var(--o-spacing-h2);
    width: 100%;

    h3 {
      font-size: var(--o-font-size-h3);
      font-weight: 300;
      color: var(--o-color-text1);
      line-height: var(--o-line-height-h3);
      width: 100%;
      text-align: center;
      @media (max-width: 768px) {
        font-size: var(--o-font-size-h8);
        line-height: var(--o-line-height-h8);
      }
    }
  }
}

.ppt {
  &-list {
    display: grid;
    width: 100%;
    margin-top: var(--o-spacing-h2);
    justify-items: center;
    align-items: center;
    grid-template-columns: repeat(4, 1fr);
    grid-gap: var(--o-spacing-h4);
    @media (max-width: 768px) {
      font-size: var(--o-font-size-h8);
      line-height: var(--o-line-height-h8);
    }
  }
  &-item {
    width: 100%;

    a {
      width: 100%;
      img {
        width: 100%;
      }
    }
    :deep(.el-card__body) {
      padding: 0;
    }
  }

  &-word {
    padding: var(--o-spacing-h4);
    color: var(--o-color-text1);
    font-size: var(--o-font-size-h7);
    line-height: var(--o-line-height-h7);
    @media (max-width: 768px) {
      padding: var(--o-spacing-h6);
      font-size: var(--o-font-size-text);
      line-height: var(--o-line-height-text);
      font-weight: 500;
    }
  }
}

@media (max-width: 1280px) {
  .ppt-list,
  .brand-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 880px) {
  .ppt-list,
  .brand-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .ppt-list,
  .brand-list {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
