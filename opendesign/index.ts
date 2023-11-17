import type { App } from 'vue';

import './style/variable.scss';

import { Button } from './button';
import { Radio, RadioGroup } from './radio';
import { Checkbox, CheckboxGroup } from './checkbox';
import { Select, Option } from './select';
import { DatePicker } from './data-picker';
import { TimeSelect } from './time-select';

import { Icon } from './icon';
import { Card } from './card';
import { Dialog } from './dialog';
import { Tag } from './tag';
import { Tabs, TabPane } from './tabs';
import { Input } from './input';
import { Tree } from './tree';
import { Pagination } from './pagination';
import { Table, TableColumn } from './table';
import { Timeline } from './timeline';
import { Search } from './search';
import { Drawer } from './drawer';
import { Switch } from './switch';
import { Collapse, CollapseItem } from './collapse';
import { Container } from './container';

const components = [
  Button,
  Radio,
  RadioGroup,
  Checkbox,
  CheckboxGroup,
  Select,
  Option,
  DatePicker,
  TimeSelect,
  Icon,
  Card,
  Dialog,
  Pagination,
  Table,
  TableColumn,
  Tag,
  Timeline,
  Input,
  Tabs,
  TabPane,
  Tree,
  Search,
  Drawer,
  Switch,
  Collapse,
  CollapseItem,
  Container,
];
export default {
  install(app: App): void {
    components.forEach((component) => {
      app.use(component as any);
    });
  },
};
