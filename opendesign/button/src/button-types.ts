import { ExtractDefaultPropTypes, PropType } from 'vue';
import { SizeType } from '../../_utils/common';

type ButtonType = 'outline' | 'primary' | 'secondary' | 'text';
// TODO:status颜色规范待补充
type ButtonStatus = 'normal';
type ButtonNativeType = 'button' | 'submit' | 'reset';

export const buttonProps = {
  size: {
    type: String as PropType<SizeType>,
    default: 'medium',
  },
  type: {
    type: String as PropType<ButtonType>,
    default: 'outline',
  },
  status: {
    type: String as PropType<ButtonStatus>,
    default: 'nomral',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  animation: {
    type: Boolean,
    default: false,
  },
  nativeType: {
    type: String as PropType<ButtonNativeType>,
    default: 'button',
  },
};

export type ButtonProps = ExtractDefaultPropTypes<typeof buttonProps>;
