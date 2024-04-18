import { IColumn, Icon, mergeStyleSets } from '@fluentui/react';
import * as React from 'react';
import { ComparisonListItem } from '../Model/BundleComparison';
import { ListItem } from '../Model/FileList';
import { SizeListItem } from '../Model/SingleBundle';

const classNames = mergeStyleSets({
  numericColumn: {
    textAlign: 'right'
  }
});

function colorFraction(val: number): `rgb(${number},${number},${number})` {
  let rgb: [number, number, number];

  if (val >= 0) {
    // Red shade
    const colorVal = Math.min(Math.round((1 - val) * 155) + 100, 255);
    rgb = [255, colorVal, colorVal];
  } else {
    // Green shade
    const colorVal = Math.min(Math.round((val + 1) * 155) + 100, 255);
    rgb = [colorVal, 255, colorVal];
  }
  return `rgb(${rgb.join(',')})` as `rgb(${number},${number},${number})`;
}

function colorDirection(value: number): `rgb(${number},${number},${number})` | undefined {
  if (value > 0) {
    return 'rgb(255, 0, 0)';
  } else if (value < 0) {
    return 'rgb(0, 128, 0)';
  }
  return undefined;
}

const SignedFormat: Intl.NumberFormatOptions = { signDisplay: 'exceptZero' };

const PercentageFormat: Intl.NumberFormatOptions = { style: 'percent', minimumFractionDigits: 2 };

const ByteFormattingRules: [limit: number, format: Intl.NumberFormatOptions][] = [
  [10240, { style: 'unit', unit: 'byte', unitDisplay: 'narrow', useGrouping: true }],
  [10485760, { style: 'unit', unit: 'kilobyte', unitDisplay: 'narrow', useGrouping: true, minimumFractionDigits: 2 }],
  [10737418240, { style: 'unit', unit: 'megabyte', unitDisplay: 'narrow', useGrouping: true, minimumFractionDigits: 2 }]
];

function ByteFormat(value: number): Intl.NumberFormatOptions {
  for (const [limit, format] of ByteFormattingRules) {
    if (value <= limit) {
      return format;
    }
  }
  return ByteFormattingRules[ByteFormattingRules.length - 1][1];
}

type ColorFunction = (val: number) => `rgb(${number},${number},${number})` | undefined;

interface CellValueProps {
  value: number;
  format?:
    | Intl.NumberFormatOptions
    | ((value: number) => Intl.NumberFormatOptions)
    | (Intl.NumberFormatOptions | ((value: number) => Intl.NumberFormatOptions))[];
  color?: ColorFunction;
  background?: ColorFunction;
}

const CellValue: React.FC<CellValueProps> = ({ value, format, color, background }) => {
  const style = React.useMemo(
    () => ({
      color: color?.(value),
      backgroundColor: background?.(value)
    }),
    [color, background, value]
  );
  const formatOptions = React.useMemo<Intl.NumberFormatOptions>(() => {
    if (!format) {
      return {};
    }
    function evaluateFormat(format: Intl.NumberFormatOptions | ((value: number) => Intl.NumberFormatOptions)) {
      if (typeof format === 'function') {
        return format(value);
      }
      return format;
    }

    if (format instanceof Array) {
      return Object.assign({}, ...format.map<Intl.NumberFormatOptions>(evaluateFormat));
    }
    return evaluateFormat(format);
  }, [format, value]);

  let adjustedValue = value;
  if (formatOptions.style === 'unit') {
    switch (formatOptions.unit) {
      case 'kilobyte':
        adjustedValue /= 1024;
        break;
      case 'megabyte':
        adjustedValue /= 1048576;
        break;
    }
  }

  return (
    <div style={style}>
      {!!value && Number.isFinite(value) ? adjustedValue.toLocaleString(undefined, formatOptions) : '--'}
    </div>
  );
};

const numericColumnBase: Omit<IColumn, 'key' | 'name'> = {
  minWidth: 80,
  isResizable: true,
  className: classNames.numericColumn
};

const nameColumn: IColumn = {
  key: 'name',
  name: 'Name',
  fieldName: 'name',
  minWidth: 120,
  isResizable: true,
  onRender: (item: ListItem<unknown, unknown, unknown>) => (
    <span style={{ paddingLeft: item.level * 24 }}>
      <Icon iconName={item.isDirectory ? (item.expanded ? 'ChevronDownMed' : 'ChevronRightMed') : 'FileCode'} />
      <span style={{ marginLeft: 10 }}>{item.name}</span>
    </span>
  )
};

export const singleBundleColumns: IColumn[] = [
  nameColumn,
  {
    key: 'size',
    name: 'Size',
    ...numericColumnBase,
    onRender: (item: SizeListItem) => <CellValue value={item.meta.size} format={ByteFormat} />
  },
  {
    key: 'pctSize',
    name: '% Size',
    ...numericColumnBase,
    onRender: (item: SizeListItem) => (
      <CellValue value={item.descendantInfo.ratioOfTotal} background={colorFraction} format={PercentageFormat} />
    )
  },
  {
    key: 'pctSizeParent',
    name: '% Size in Parent',
    ...numericColumnBase,
    onRender: (item: SizeListItem) => (
      <CellValue value={item.descendantInfo.ratioOfParent} background={colorFraction} format={PercentageFormat} />
    )
  }
];

export const bundleComparisonColumns: IColumn[] = [
  nameColumn,
  {
    key: 'leftSize',
    name: 'Left Size',
    ...numericColumnBase,
    onRender: (item: ComparisonListItem) => <CellValue value={item.meta.left.size} format={ByteFormat} />
  },
  {
    key: 'rightSize',
    name: 'Right Size',
    ...numericColumnBase,
    onRender: (item: ComparisonListItem) => <CellValue value={item.meta.right.size} format={ByteFormat} />
  },
  {
    key: 'changeSize',
    name: 'Change',
    ...numericColumnBase,
    onRender: (item: ComparisonListItem) => (
      <CellValue
        value={item.meta.right.size - item.meta.left.size}
        color={colorDirection}
        format={[ByteFormat, SignedFormat]}
      />
    )
  },
  {
    key: 'pctSizeChange',
    name: '% Size Change',
    ...numericColumnBase,
    onRender: (item: ComparisonListItem) => (
      <CellValue
        value={(item.meta.right.size - item.meta.left.size) / item.meta.left.size}
        background={colorFraction}
        format={PercentageFormat}
      />
    )
  },
  {
    key: 'pctTotalChange',
    name: '% Total Change',
    ...numericColumnBase,
    onRender: (item: ComparisonListItem) => (
      <CellValue value={item.descendantInfo.ratioChangeOfTotal} background={colorFraction} format={PercentageFormat} />
    )
  }
];
