import { defineComponent } from 'vue';
import { containerProps, ContainerProps } from './container-types';
import './container.scss';

export default defineComponent({
  name: 'OContainer',
  props: containerProps,
  setup(props: ContainerProps, { slots }) {
    return () => {
      return (
        <div class={`o-container o-container-level${props.levelIndex}`}>
          {slots.default?.()}
        </div>
      );
    };
  },
});
