<script setup lang="ts">
import { useAttrs, nextTick, onMounted, onUnmounted, computed } from 'vue';
import { debounce } from 'lodash';

const attrs = useAttrs();
const props = defineProps({
  listenerScorll: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['scorll-bottom']);

const debounceEvent = debounce(
  function () {
    const isBottom =
      this.scrollHeight - this.scrollTop - 10 <= this.clientHeight;
    if (isBottom) {
      emit('scorll-bottom');
    }
  },
  300,
  {
    trailing: true,
  }
);

const classNames = computed(() => {
  return `${attrs['custom-class']} o-select-dropdown`;
});

let optionDom: null | HTMLElement = null;

// 移动端 输入框无法弹出
function cancalReadOnly(onOff) {
  nextTick(() => {
    if (!onOff) {
      const input = document.querySelector('.el-input__inner');
      if (input) {
        input.removeAttribute('readonly');
      }
    }
  });
}
function scrollEvent(val) {
  cancalReadOnly(val);
  if (val && props.listenerScorll) {
    nextTick(() => {
      optionDom = document.querySelector(
        '.el-select__popper[aria-hidden="false"] .el-select-dropdown .el-select-dropdown__wrap'
      );
      if (optionDom) {
        optionDom.addEventListener('scroll', debounceEvent);
      }
    });
  }
}
onMounted(() => {
  cancalReadOnly(false);
});
onUnmounted(() => {
  if (optionDom) {
    optionDom.removeEventListener('scroll', debounceEvent);
  }
});
</script>

<template>
  <ElSelect
    class="o-select"
    :popper-class="classNames"
    v-bind="attrs"
    @visible-change="scrollEvent"
  >
    <template #prefix>
      <svg
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 32 32"
      >
        <path
          fill="currentColor"
          d="M14.667 4c5.891 0 10.667 4.776 10.667 10.667 0 2.464-0.836 4.734-2.239 6.54l4.448 4.45-1.886 1.886-4.451-4.448c-1.806 1.404-4.075 2.239-6.54 2.239-5.891 0-10.667-4.776-10.667-10.667s4.776-10.667 10.667-10.667zM14.667 6.667c-4.418 0-8 3.582-8 8s3.582 8 8 8c4.418 0 8-3.582 8-8s-3.582-8-8-8z"
        ></path>
      </svg>
    </template>
    <slot> </slot>
  </ElSelect>
</template>

<style lang="scss">
.o-select {
  --o-select-font-tip: var(--o-font-size-tip);
  --o-select-font-text: var(--o-color-text4);
  --o-select-color-bg: var(--o-color-bg2);
  --o-select-shadow: var(--o-shadow-l1);
  --o-select-shadow_hover: var(--o-shadow-l2);
  border: none;
  --el-select-border-color-hover: transparent !important;
  &:hover {
    box-shadow: var(--o-select-shadow_hover);
  }
  .el-input__wrapper {
    background-color: var(--o-select-color-bg);
    border-radius: 0;
    box-shadow: var(--o-select-shadow);
    &:hover {
      border: none;
    }
  }
  .el-input__prefix-inner {
    .o-icon {
      display: flex;
      align-items: center;
    }
  }
  .el-input__suffix {
    height: 40px;
    .el-icon {
      svg {
        color: var(--o-select-font-text);
      }
    }
  }
  @media screen and (max-width: 867px) {
    .el-input {
      height: 34px;
      .el-input__wrapper {
        padding: var(--o-spacing-h8);
        .el-input__inner {
          font-size: var(--o-select-font-tip);
        }
      }
      .el-input__suffix {
        height: 34px;
      }
    }
  }
}
</style>
