import { ExtractDefaultPropTypes } from 'vue';

export const timelineProps = {
  leftArrow: {
    type: Boolean,
    default: true,
  },
  rightArrow: {
    type: Boolean,
    default: true,
  },
  modelValue: {
    type: String,
    default: '',
  },
};

export type TimelineProps = ExtractDefaultPropTypes<typeof timelineProps>;
