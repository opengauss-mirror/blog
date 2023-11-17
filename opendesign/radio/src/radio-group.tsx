import { defineComponent, provide, toRefs } from 'vue';
import {
  radioGroupKey,
  radioGroupProps,
  RadioGroupProps,
} from './radio-group-types';
import './radio-group.scss';

export default defineComponent({
  name: 'ORadioGroup',
  props: radioGroupProps,
  emits: ['update:modelValue', 'change'],
  setup(props: RadioGroupProps, { emit, slots }) {
    const { modelValue, disabled } = toRefs(props);

    const onChange = (val: string | number | boolean) => {
      emit('update:modelValue', val);
      emit('change', val);
    };

    // 注入
    provide(radioGroupKey, { modelValue, disabled, onChange });

    return () => {
      return <div class="o-radio-group">{slots.default?.()}</div>;
    };
  },
});
