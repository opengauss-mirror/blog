import { ExtractDefaultPropTypes, InjectionKey, PropType, Ref } from 'vue';

export const radioGroupProps = {
  // 双向绑定值
  modelValue: {
    type: [String, Number, Boolean] as PropType<string | number | boolean>,
    default: null,
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false,
  },
};

export type RadioGroupProps = ExtractDefaultPropTypes<typeof radioGroupProps>;

interface RadioGroupInjection {
  modelValue: Ref<string | number | boolean>;
  disabled: Ref<boolean>;
  // eslint-disable-next-line no-unused-vars
  onChange: (val: string | number | boolean) => void;
}

export const radioGroupKey: InjectionKey<RadioGroupInjection> =
  Symbol('ORadioGroup');
