import type { App } from 'vue';

import './style/variable.scss';

import { Button } from './button';
import { Select, Option } from './select';
import { Icon } from './icon';
import { Card } from './card';
import { Tag } from './tag';
import { Pagination } from './pagination';

const components = [Button, Select, Option, Icon, Card, Pagination, Tag];
export default {
  install(app: App): void {
    components.forEach((component) => {
      app.use(component as any);
    });
  },
};
