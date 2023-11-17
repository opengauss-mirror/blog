import { ExtractDefaultPropTypes, PropType } from 'vue';

export const checkboxProps = {
  // 双向绑定值
  modelValue: {
    type: [String, Number, Boolean] as PropType<string | number | boolean>,
    default: null,
  },
  // value
  value: {
    type: [String, Number, Boolean] as PropType<string | number | boolean>,
    required: true,
    default: null,
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false,
  },
  // name
  name: {
    type: String,
    default: '',
  },
};

export type CheckboxProps = ExtractDefaultPropTypes<typeof checkboxProps>;
