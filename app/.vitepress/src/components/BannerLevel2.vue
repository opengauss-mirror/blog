<script setup lang="ts">
import { computed, CSSProperties, useSlots } from 'vue';

const slots = useSlots();

const props = defineProps({
  backgroundImage: {
    type: String,
    default: '',
  },
  backgroundColor: {
    type: String,
    default: '',
  },
  backgroundText: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  subtitle: {
    type: String,
    default: '',
  },
  illustration: {
    type: String,
    default: '',
  },
});

const rootStyle = computed(() => {
  const result: CSSProperties = {};

  if (props.backgroundColor) {
    result.backgroundColor = props.backgroundColor;
  }
  return result;
});
</script>

<template>
  <div class="banner-level2" :style="rootStyle">
    <img :src="props.backgroundImage" class="banner-bg" />
    <div class="wrap">
      <div class="banner-text" :class="illustration ? 'exit-illustration' : ''">
        <p v-if="backgroundText" class="banner-text-bg">
          {{ backgroundText }}
        </p>
        <h1 v-if="title" class="banner-title">{{ title }}</h1>
        <p v-if="subtitle && !slots.default" class="banner-subtitle">
          {{ subtitle }}
        </p>
        <div v-if="slots.default" class="banner-operation">
          <slot></slot>
        </div>
      </div>
      <div v-if="illustration" class="banner-illustration">
        <img :src="illustration" />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dark {
  .banner-bg,
  .banner-illustration {
    filter: brightness(0.8) grayscale(0.2) contrast(1.2);
  }

  .banner-level2 {
    background-color: var(--o-color-trafficpurple4);
  }
}
.banner-level2 {
  position: relative;
  width: 100%;
  background-size: cover;
  background-repeat: no-repeat;
  background-color: var(--o-color-trafficpurple6);

  .banner-bg {
    position: absolute;
    height: 100%;
    width: 100%;
    object-fit: cover;
    user-select: none;
    pointer-events: none;
  }

  .wrap {
    position: relative;
    max-width: 1504px;
    margin: 0 auto;
    padding: 0 44px;
    display: flex;
    justify-content: space-between;
    min-height: 280px;
    @media screen and (max-width: 1439px) {
      padding: 0 24px;
    }

    @media screen and (max-width: 1080px) {
      min-height: 200px;
      padding: 0 16px;
    }

    @media screen and (max-width: 768px) {
      min-height: 126px;
    }
    .banner-text {
      display: flex;
      flex-direction: column;
      position: relative;
      margin-top: auto;
      margin-bottom: auto;
      position: relative;
      z-index: 3;
      &.exit-illustration {
        max-width: 54%;
      }

      .banner-text-bg {
        position: absolute;
        top: 0;
        color: var(--o-color-white);
        opacity: 0.14;
        font-size: var(--o-font-size-h1);
        line-height: var(--o-line-height-h1);
        font-weight: bold;
        user-select: none;
        pointer-events: none;
        @media screen and (max-width: 1080px) {
          font-size: var(--o-font-size-h2);
          line-height: var(--o-line-height-h2);
        }

        @media screen and (max-width: 768px) {
          font-size: var(--o-font-size-h6);
          line-height: var(--o-line-height-h6);
        }
      }
      .banner-title {
        position: relative;
        z-index: 1;
        color: var(--o-color-white);
        font-size: var(--o-font-size-h2);
        line-height: var(--o-line-height-h2);
        font-weight: 500;
        @media screen and (max-width: 1080px) {
          font-size: var(--o-font-size-h3);
          line-height: var(--o-line-height-h3);
        }

        @media screen and (max-width: 768px) {
          font-size: var(--o-font-size-h6);
          line-height: var(--o-line-height-h6);
        }
      }

      .banner-subtitle {
        position: relative;
        z-index: 1;
        color: var(--o-color-white);
        font-size: var(--o-font-size-h6);
        line-height: var(--o-line-height-h6);
        margin-top: var(--o-spacing-h9);

        @media screen and (max-width: 1080px) {
          font-size: var(--o-font-size-h7);
          line-height: var(--o-line-height-h7);
        }

        @media screen and (max-width: 768px) {
          font-size: var(--o-font-size-tip);
          line-height: var(--o-line-height-tip);
        }
      }

      .banner-operation {
        margin-top: var(--o-spacing-h4);
        @media screen and (max-width: 768px) {
          margin-top: var(--o-spacing-h6);
        }
      }
    }
    .banner-illustration {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      right: 44px;
      object-fit: fill;

      @media screen and (max-width: 1439px) {
        right: 24px;
      }

      img {
        user-select: none;
        max-height: 189px;
        pointer-events: none;
        @media screen and (max-width: 1080px) {
          max-height: 160px;
        }

        @media screen and (max-width: 768px) {
          max-height: 94px;
        }
      }
    }
  }
}
</style>
