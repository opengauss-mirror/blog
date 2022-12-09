<script lang="ts" setup>
import { ref, onMounted, onUnmounted, CSSProperties, computed } from 'vue';

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  data: {
    type: Object,
    default: () => null,
  },
  offsetValue: {
    type: Number,
    default: 80,
  },
  top: {
    type: String,
    default: '15rem',
  },
  right: {
    type: String,
    default: '24px',
  },
  left: {
    type: String,
    default: 'inherit',
  },
});

interface AnchorType {
  id: string;
  children?: AnchorType;
}
// 数据
const anchorData = ref();

// 对象扁平化
function flatten(data: any) {
  return data.reduce(
    (pre: any, { id, name, children = [] }) =>
      pre.concat([{ id, name }], flatten(children)),
    []
  );
}

// 当前选中项
const selectId = ref(props.data[0].id || '');

const scroll = () => {
  // 为了保证兼容性，这里取两个值，哪个有值取哪一个
  // scrollTop就是触发滚轮事件时滚轮的高度
  const scrollTop =
    document.documentElement.scrollTop || document.body.scrollTop;

  //自定义滚动容器滚轮高度
  const targetScrollTop = props.id
    ? (document.querySelector(`#${props.id}`) as HTMLElement).scrollTop
    : 0;

  const targetArr: any = ref([]);

  targetArr.value = anchorData.value.filter((item: AnchorType) => {
    const element = document.querySelector(`#${item.id}`) as HTMLElement;
    if (!element) return;
    return (
      (props.id ? targetScrollTop : scrollTop) + props.offsetValue >
      element.offsetTop
    );
  });

  if (targetArr.value.length) {
    selectId.value =
      targetArr.value.slice(targetArr.value.length - 1).shift().id || '';
  }
};

// 点击滚动事件
const selectAnchor = (id: string) => {
  const element = document.getElementById(id);
  if (!element) return;
  anchorData.value.forEach((item: AnchorType) => {
    if (item.id === id || item.children) {
      const h = element.offsetTop;

      const container = props.id
        ? (document.querySelector(`#${props.id}`) as HTMLElement)
        : window;

      container.scrollTo({
        left: 0,
        top: h,
        behavior: 'smooth',
      });
    }
  });
};

// const scrollToTop = () => {
//   const body = document.getElementById(props.id) || document.documentElement;
//   body.scrollTop = 0;
// };

onMounted(() => {
  anchorData.value = flatten(props.data);
  const body = props.id ? document.getElementById(props.id) : window;
  body?.addEventListener('scroll', scroll);
});

onUnmounted(() => {
  const body = props.id ? document.getElementById(props.id) : window;
  body?.removeEventListener('scroll', scroll);
});

//自定义样式
const rootStyle = computed(() => {
  const result: CSSProperties = {};
  if (props.top) {
    result.top = props.top;
  }
  if (props.left) {
    result.left = props.left;
  }
  if (props.right) {
    result.right = props.right;
  }
  return result;
});
</script>

<template>
  <div class="anchor" :class="id ? 'scroll-target' : ''" :style="rootStyle">
    <ul>
      <li v-for="item in data" :key="item.id" class="anchor-item">
        <span
          class="anchor-item-label"
          :class="item.id === selectId ? 'active' : ''"
          @click="selectAnchor(item.id)"
          ><i class="anchor-dot"></i>{{ item.name }}</span
        >

        <template v-if="item.children?.length > 0">
          <div class="anchor-sublist">
            <a
              v-for="subItem in item.children"
              :key="subItem.id"
              class="anchor-sublist-item"
              :class="subItem.id === selectId ? 'active' : ''"
              @click="selectAnchor(subItem.id)"
            >
              {{ subItem.name }}
            </a>
          </div>
        </template>
      </li>
    </ul>
  </div>
</template>

<style lang="scss" scoped>
.anchor {
  position: fixed;
  width: 200px;
  z-index: 99;
  &.scroll-target {
    position: absolute;
  }
  .icon {
    font-size: 34px;
    cursor: pointer;
  }

  &-item {
    position: relative;

    &:not(:last-of-type) {
      &::after {
        content: '';
        display: block;
        position: absolute;
        top: 10px;
        left: 5px;
        width: 1px;
        height: 100%;
        border-left: 2px solid var(--o-color-bg4);
      }
    }
    .anchor-dot {
      display: inline-block;
      width: 12px;
      height: 12px;
      text-align: center;
      line-height: 26px;
      border-radius: 50%;
      background: var(--o-color-bg2);
      margin-right: 12px;
      border: 2px solid var(--o-color-bg4);
    }
    &-label {
      position: relative;
      display: flex;
      align-items: center;
      line-height: 30px;
      font-size: var(--o-font-size-h8);
      color: var(--o-color-text1);
      cursor: pointer;
      z-index: 2;

      &.active {
        color: var(--o-color-brand1);
        .anchor-dot {
          border-color: var(--o-color-brand1);
        }
      }
      &:not(:first-of-type) {
        margin-top: 32px;
      }
    }

    .anchor-sublist {
      display: block;
      &-item {
        display: block;
        padding-left: 40px;
        line-height: 24px;
        cursor: pointer;
        &.active {
          color: var(--o-color-brand1);
        }
      }
    }
  }
}
</style>
