import { ExtractDefaultPropTypes, PropType } from 'vue';

export const selectProps = {
  // 双向绑定值
  modelValue: {
    type: [String, Number, Boolean] as PropType<string | number | boolean>,
  },
};

export type SelectProps = ExtractDefaultPropTypes<typeof selectProps>;
