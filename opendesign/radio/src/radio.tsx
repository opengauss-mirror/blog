import { computed, defineComponent, inject } from 'vue';
import { radioGroupKey } from './radio-group-types';
import { radioProps, RadioProps } from './radio-types';
import './radio.scss';

export default defineComponent({
  name: 'ORadio',
  props: radioProps,
  emits: ['update:modelValue', 'change'],
  setup(props: RadioProps, { emit, slots }) {
    const radioGroupInjection = inject(radioGroupKey, null);

    // 是否禁用
    const isDisabled = computed(
      () => radioGroupInjection?.disabled.value || props.disabled
    );

    // 是否选中
    const isChecked = computed(
      () =>
        props.value ===
        (radioGroupInjection
          ? radioGroupInjection.modelValue.value
          : props.modelValue)
    );

    const onClick = (e: Event) => {
      e.stopPropagation();
    };

    const onChange = () => {
      if (isDisabled.value) {
        return;
      }

      const val = props.value;
      radioGroupInjection?.onChange(val);
      emit('update:modelValue', val);
      emit('change', val);
    };

    const getContent = () => {
      if (slots.radio) {
        return slots.radio({
          checked: isChecked.value,
          disabled: isDisabled.value,
        });
      } else {
        return (
          <>
            <span class="o-radio-icon"></span>
            <span class="o-radio-label">{slots.default?.()}</span>
          </>
        );
      }
    };

    return () => {
      return (
        <label
          class={[
            'o-radio',
            isChecked.value ? 'o-radio-checked' : '',
            isDisabled.value ? 'o-radio-disabled' : '',
          ]}
        >
          <input
            type="radio"
            disabled={isDisabled.value}
            checked={isChecked.value}
            onClick={onClick}
            onChange={onChange}
          />
          {getContent()}
        </label>
      );
    };
  },
});
