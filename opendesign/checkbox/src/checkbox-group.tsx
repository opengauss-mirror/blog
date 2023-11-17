import { defineComponent, provide, toRefs } from 'vue';
import {
  checkboxGroupKey,
  checkboxGroupProps,
  CheckboxGroupProps,
} from './checkbox-group-types';
import './checkbox-group.scss';

export default defineComponent({
  name: 'OCheckboxGroup',
  props: checkboxGroupProps,
  emits: ['update:modelValue', 'change'],
  setup(props: CheckboxGroupProps, { emit, slots }) {
    const { modelValue, disabled } = toRefs(props);

    const onChange = (val: Array<string | number | boolean>) => {
      emit('update:modelValue', val);
      emit('change', val);
    };

    // 注入
    provide(checkboxGroupKey, { modelValue, disabled, onChange });

    return () => {
      return <div class="o-checkbox-group">{slots.default?.()}</div>;
    };
  },
});
