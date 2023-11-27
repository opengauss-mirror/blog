import { computed, defineComponent, inject } from 'vue';
import { checkboxGroupKey } from './checkbox-group-types';
import { checkboxProps, CheckboxProps } from './checkbox-types';
import './checkbox.scss';

export default defineComponent({
  name: 'OCheckbox',
  props: checkboxProps,
  emits: ['update:modelValue', 'change'],
  setup(props: CheckboxProps, { emit, slots }) {
    const checkboxGroupInjection = inject(checkboxGroupKey, null);

    // 是否禁用
    const isDisabled = computed(
      () => checkboxGroupInjection?.disabled.value || props.disabled
    );

    // 是否选中
    const isChecked = computed(() =>
      checkboxGroupInjection
        ? checkboxGroupInjection.modelValue.value.includes(props.value)
        : props.value === props.modelValue
    );

    const onClick = (e: Event) => {
      e.stopPropagation();
    };

    const onChange = (e: Event) => {
      if (isDisabled.value) {
        return;
      }
      const { checked } = e.target as HTMLInputElement;
      let newValue;
      if (checkboxGroupInjection) {
        newValue = [...checkboxGroupInjection.modelValue.value];
        if (checked) {
          newValue.push(props.value);
        } else {
          newValue = newValue.filter((item) => item !== props.value);
        }

        checkboxGroupInjection?.onChange(newValue);
      } else {
        newValue = props.value;
      }

      emit('update:modelValue', newValue);
      emit('change', newValue);
    };

    const getContent = () => {
      if (slots.checkbox) {
        return slots.checkbox({
          checked: isChecked.value,
          disabled: isDisabled.value,
        });
      } else {
        return (
          <>
            <span class="o-checkbox-icon">
              {isChecked.value ? (
                <svg
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                >
                  <path
                    fill="currentColor"
                    d="M27.797 10.085l-14.133 14.133c-0.125 0.126-0.296 0.197-0.473 0.197s-0.348-0.071-0.473-0.197l-7.187-7.187c-0.126-0.125-0.197-0.296-0.197-0.473s0.071-0.348 0.197-0.473l0.933-0.933c0.125-0.126 0.296-0.197 0.473-0.197s0.348 0.071 0.473 0.197l5.773 5.773 12.733-12.733c0.264-0.256 0.683-0.256 0.947 0l0.933 0.947c0.126 0.125 0.197 0.296 0.197 0.473s-0.071 0.348-0.197 0.473z"
                  ></path>
                </svg>
              ) : (
                ''
              )}
            </span>
            <span class="o-checkbox-label">{slots.default?.()}</span>
          </>
        );
      }
    };

    return () => {
      return (
        <label
          class={['o-checkbox', isChecked.value ? 'o-checkbox-checked' : '']}
        >
          <input
            type="checkbox"
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
