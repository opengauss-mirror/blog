import { ExtractDefaultPropTypes, PropType } from 'vue';

type ContainerLevelIndex = 1 | 2 | 3 | 4 | 5;

export const containerProps = {
  // 层级
  levelIndex: {
    type: Number as PropType<ContainerLevelIndex>,
    default: 2,
  },
  // 是否有阴影
  shadow: {
    type: Boolean,
    default: true,
  },
};

export type ContainerProps = ExtractDefaultPropTypes<typeof containerProps>;
