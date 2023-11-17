import { defineComponent, ref, Ref, toRefs, onMounted } from 'vue';
import { timelineProps, TimelineProps } from './timeline-types';
import IconLeft from '~icons/app/icon-chevron-left.svg';
import IconRight from '~icons/app/icon-chevron-right';
import IconChecked from '~icons/app/icon-checked.svg';
import IconUnchecked from '~icons/app/icon-unchecked.svg';
import './timeline.scss';

export default defineComponent({
  name: 'OTimeline',
  props: timelineProps,
  emits: ['update:modelValue'],
  setup(props: TimelineProps, { emit }) {
    const { leftArrow, rightArrow, modelValue } = toRefs(props);
    // 六月
    const SPLITEMONTH = 6;
    // 时间线列表
    const timeList: Ref<string[]> = ref([]);
    // 命中的tab
    const activeTab = ref(5);
    // 最左与最右阈值
    const leftThreshold = '2020-10';
    const rightThreshold: Ref<string> = ref('');
    // 时间线列表赋值
    const changeDate = (year: number, month: number): Array<string> => {
      const result: Array<string> = [];
      if (month >= SPLITEMONTH) {
        for (let i = 0; i < 6; i++) {
          result.push(
            year +
              '-' +
              (month - (6 - i - 1) >= 10
                ? month - (6 - i - 1)
                : '0' + (month - (6 - i - 1)))
          );
        }
      } else {
        // last year
        for (let i = 1; i <= 6 - month; i++) {
          result.push(
            year -
              1 +
              '-' +
              (6 + i + month >= 10 ? 6 + i + month : '0' + (6 + i + month))
          );
        }
        // this year
        for (let i = 1; i < month + 1; i++) {
          result.push(year + '-0' + i);
        }
      }
      return result;
    };
    // 初始化时间线列表赋值
    const initDate = () => {
      const modelDate = !isNaN(new Date(modelValue.value).getTime())
        ? new Date(modelValue.value)
        : new Date();
      const modelYear = modelDate.getFullYear();
      const _modelYear =
        modelDate.getFullYear() === 2020 ? 2021 : modelDate.getFullYear();
      const modelMonth =
        (modelYear === 2021 && modelDate.getMonth() + 1 < 3) ||
        modelYear === 2020
          ? 3
          : modelDate.getMonth() + 1;
      const year = new Date().getFullYear();
      const month = new Date().getMonth() + 1;
      rightThreshold.value = year + '-' + (month >= 10 ? month : '0' + month);
      timeList.value = changeDate(_modelYear, modelMonth);
      emit('update:modelValue', timeList.value[activeTab.value]);
    };
    // 点击时间线tab
    const useClickTab = (index: number): void => {
      activeTab.value = index;
      emit('update:modelValue', timeList.value[activeTab.value]);
    };
    // 点击左侧按钮
    const useClickLeft = () => {
      const date = new Date(timeList.value[4]);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      timeList.value = changeDate(year, month);
      emit('update:modelValue', timeList.value[activeTab.value]);
    };
    // 点击右侧按钮
    const useClickRight = () => {
      const date = new Date(timeList.value[5]);
      const year = date.getFullYear();
      const month = date.getMonth() + 2;
      timeList.value =
        month <= 12 ? changeDate(year, month) : changeDate(year + 1, 1);
      emit('update:modelValue', timeList.value[activeTab.value]);
    };

    onMounted(() => {
      initDate();
    });

    return () => {
      return (
        <div class="o-timeline">
          {leftArrow &&
          leftArrow.value &&
          timeList.value[0] !== leftThreshold ? (
            <IconLeft
              onClick={() => useClickLeft()}
              class="o-timeline-left-arrow"
            ></IconLeft>
          ) : (
            ''
          )}
          <ul class="o-timeline-list">
            {timeList.value &&
              timeList.value.map((item, index) => {
                return (
                  <li
                    class={[
                      'o-timeline-item',
                      index === activeTab.value ? 'active' : '',
                    ]}
                    onClick={() => useClickTab(index)}
                  >
                    <p class="o-timeline-day">{item}</p>
                    {index === activeTab.value ? (
                      <IconChecked class="o-timeline-icon"></IconChecked>
                    ) : (
                      <IconUnchecked class="o-timeline-icon"></IconUnchecked>
                    )}
                  </li>
                );
              })}
          </ul>
          {rightArrow &&
          rightArrow.value &&
          timeList.value[5] !== rightThreshold.value ? (
            <IconRight
              class="o-timeline-right-arrow"
              onClick={() => useClickRight()}
            ></IconRight>
          ) : (
            ''
          )}
        </div>
      );
    };
  },
});
