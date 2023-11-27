import { computed, defineComponent, toRefs } from 'vue';
import { buttonProps, ButtonProps } from './button-types';
import './button.scss';

export default defineComponent({
  name: 'OButton',
  props: buttonProps,
  emits: ['click'],
  setup(props: ButtonProps, { emit, slots }) {
    const { size, type, status, disabled, animation, nativeType } =
      toRefs(props);

    const classNames = computed(() => ({
      'o-button': true,
      [`o-button-size-${size.value}`]: true,
      [`o-button-type-${type.value}`]: true,
      [`o-button-status-${status.value}`]: true,
      'with-prefix': slots.prefixIcon,
      'with-suffix': slots.suffix,
      animation: animation.value,
      'is-disabled': disabled.value,
    }));

    const onClick = (e: MouseEvent) => {
      emit('click', e);
    };

    return () => {
      return (
        <button
          class={classNames.value}
          onClick={onClick}
          type={nativeType.value}
        >
          {slots.prefixIcon && (
            <span class="prefix-icon">{slots.prefixIcon()}</span>
          )}
          {slots.default?.()}
          {slots.suffixIcon && (
            <span class="suffix-icon">{slots.suffixIcon()}</span>
          )}
        </button>
      );
    };
  },
});
