import { ExtractDefaultPropTypes, InjectionKey, PropType, Ref } from 'vue';

export const checkboxGroupProps = {
  // 双向绑定值
  modelValue: {
    type: Array as PropType<Array<string | number | boolean>>,
    default: null,
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false,
  },
};

export type CheckboxGroupProps = ExtractDefaultPropTypes<
  typeof checkboxGroupProps
>;

interface CheckboxGroupInjection {
  modelValue: Ref<Array<string | number | boolean>>;
  disabled: Ref<boolean>;
  // eslint-disable-next-line no-unused-vars
  onChange: (val: Array<string | number | boolean>) => void;
}

export const checkboxGroupKey: InjectionKey<CheckboxGroupInjection> =
  Symbol('OCheckboxGroup');
